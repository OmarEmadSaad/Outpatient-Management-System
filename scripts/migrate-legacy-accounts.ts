import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import type { App, AppOptions, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import type { Database } from "firebase-admin/database";
import { at, entriesOf } from "./json.ts";
import type {
  ClassifiedAccount,
  LegacyAccount,
  Status,
} from "./legacyAccountTypes.ts";
import {
  applyDecisions,
  describePlan,
  checkDuplicateReferences,
  collectKnownEmails,
  loadDecisions,
  maskEmail,
  optionValue,
  recordPath,
  statusLabel,
  writePlan,
} from "./migrationPlan.ts";

const COLLECTIONS = ["users", "doctors", "admin", "admins"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const BACKUP_FLAG = "--i-have-a-database-backup";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseURL = process.env.FIREBASE_DATABASE_URL;
const usesEmulator = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST);

const optionalText = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const serviceAccount = (): ServiceAccount => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const parsed: unknown = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    );
    return {
      projectId: optionalText(at(parsed, "project_id")),
      clientEmail: optionalText(at(parsed, "client_email")),
      privateKey: optionalText(at(parsed, "private_key")),
    };
  }
  return {
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
};

const createApp = (): App => {
  if (!projectId || !databaseURL) {
    throw new Error("Set FIREBASE_PROJECT_ID and FIREBASE_DATABASE_URL.");
  }
  if (apply && !process.env.FIREBASE_WEB_API_KEY) {
    throw new Error(
      "Set FIREBASE_WEB_API_KEY so each migrated login can be verified."
    );
  }
  if (apply && !usesEmulator && !args.has(BACKUP_FLAG)) {
    throw new Error(
      `Refusing to modify a live database without ${BACKUP_FLAG}. Export a backup first.`
    );
  }
  const options: AppOptions = usesEmulator
    ? { projectId, databaseURL }
    : { credential: cert(serviceAccount()), projectId, databaseURL };
  return initializeApp(options, "legacy-account-migration");
};

const collectLegacyAccounts = async (
  database: Database
): Promise<LegacyAccount[]> => {
  const accounts: LegacyAccount[] = [];
  for (const collection of COLLECTIONS) {
    const records: unknown = (await database.ref(collection).get()).val() || {};
    for (const [key, record] of entriesOf(records)) {
      const password = at(record, "password");
      if (
        record &&
        (typeof password === "string" || typeof password === "number")
      ) {
        accounts.push({
          collection,
          key,
          record: {
            password,
            email: at(record, "email"),
            name: at(record, "name"),
            id: at(record, "id"),
            role: at(record, "role"),
          },
        });
      }
    }
  }
  return accounts;
};

const classify = (accounts: LegacyAccount[]): ClassifiedAccount[] => {
  const emailCounts = new Map<string, number>();
  accounts.forEach(({ record }) => {
    const email = String(record.email || "")
      .trim()
      .toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  });

  return accounts.map((account) => {
    const email = String(account.record.email || "")
      .trim()
      .toLowerCase();
    const password = String(account.record.password).trim();
    let status: Status = "migratable";
    if (!EMAIL_PATTERN.test(email)) status = "invalid-email";
    else if ((emailCounts.get(email) ?? 0) > 1) status = "duplicate-email";
    else if (password.length < MIN_PASSWORD_LENGTH)
      status = "needs-password-reset";
    return { ...account, email, password, status };
  });
};

const ensureAuthUser = async (
  auth: Auth,
  { email, password, record }: ClassifiedAccount
): Promise<string> => {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch (error) {
    if (at(error, "code") !== "auth/user-not-found") throw error;
    const created = await auth.createUser({
      email,
      password,
      displayName: record.name ? String(record.name) : undefined,
    });
    return created.uid;
  }
};

const verifySignIn = async ({
  email,
  password,
}: ClassifiedAccount): Promise<unknown> => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const base = host
    ? `http://${host}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  const response = await fetch(
    `${base}/v1/accounts:signInWithPassword?key=${encodeURIComponent(
      String(apiKey)
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      `verification failed (${at(data, "error", "message") || response.status})`
    );
  return at(data, "localId");
};

const sameLegacyPassword = (current: unknown, verified: string): boolean =>
  current !== null &&
  (String(current) === verified || String(current).trim() === verified);

const migrate = async (
  database: Database,
  auth: Auth,
  account: ClassifiedAccount
): Promise<void> => {
  const uid = await ensureAuthUser(auth, account);
  const verifiedUid = await verifySignIn(account);
  if (verifiedUid !== uid) {
    throw new Error(
      "existing Firebase login does not accept this legacy password; left untouched"
    );
  }

  await database.ref().update({
    [`authLinks/${uid}`]: {
      collection: account.collection,
      key: account.key,
      linkedAt: new Date().toISOString(),
      source: "legacy-password-batch-migration",
    },
    [`${account.collection}/${account.key}/authUid`]: uid,
  });
  const removal = await database
    .ref(`${account.collection}/${account.key}/password`)
    .transaction((current: unknown) => {
      if (current === null) return null;
      return sameLegacyPassword(current, account.password) ? null : undefined;
    });
  if (!removal.committed)
    throw new Error("password changed during migration; left untouched");
};

const isLinkedToOtherRecord = async (
  database: Database,
  auth: Auth,
  account: ClassifiedAccount
): Promise<boolean> => {
  try {
    const existing = await auth.getUserByEmail(account.email);
    const link: unknown = (
      await database.ref(`authLinks/${existing.uid}`).get()
    ).val();
    return Boolean(
      link &&
        (at(link, "collection") !== account.collection ||
          at(link, "key") !== account.key)
    );
  } catch (error) {
    if (at(error, "code") === "auth/user-not-found") return false;
    throw error;
  }
};

const main = async (): Promise<void> => {
  const app = createApp();
  const database = getDatabase(app);
  const auth = getAuth(app);

  console.log(
    `${apply ? "APPLY" : "DRY RUN"} against ${
      usesEmulator ? "emulator" : "live"
    } project ${projectId}`
  );
  const accounts = applyDecisions(
    classify(await collectLegacyAccounts(database)),
    loadDecisions(optionValue("decisions")),
    await collectKnownEmails(database, COLLECTIONS)
  );
  await checkDuplicateReferences(database, accounts, apply);
  const summary: Record<string, number> = {};

  for (const account of accounts) {
    if (
      account.status === "migratable" &&
      (await isLinkedToOtherRecord(database, auth, account))
    ) {
      account.status = "email-linked-to-another-record";
    }
    const status = statusLabel(account.status);
    summary[status] = (summary[status] || 0) + 1;
    const label = `${recordPath(account)} (${maskEmail(account.email)})`;
    if (account.status !== "migratable") {
      console.log(`SKIP ${status}: ${label}`);
      continue;
    }
    if (!apply) {
      console.log(`WOULD MIGRATE: ${label}: ${describePlan(account)}`);
      continue;
    }
    try {
      await migrate(database, auth, account);
      console.log(`MIGRATED: ${label}`);
    } catch (error) {
      summary.FAILED = (summary.FAILED || 0) + 1;
      console.log(
        `FAILED: ${label}: ${at(error, "code") || at(error, "message")}`
      );
    }
  }

  console.log("\nSummary:", JSON.stringify(summary));
  const planOut = optionValue("plan-out");
  if (planOut) {
    writePlan(planOut, accounts);
    console.log(`Plan written to ${planOut} (no passwords).`);
  }
  console.log(
    'Accounts marked needs-password-reset keep their data and can use "Forgot password" on the login page.'
  );
  await deleteApp(app);
};

main().catch((error: unknown) => {
  console.error(at(error, "message"));
  process.exit(1);
});
