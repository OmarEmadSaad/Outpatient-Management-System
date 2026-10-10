import { readFileSync, writeFileSync } from "node:fs";
import type { Database } from "firebase-admin/database";
import { resolveRole } from "../src/lib/shared/roles.ts";
import { at, entriesOf, isObject } from "./json.ts";
import type { ClassifiedAccount, Status } from "./legacyAccountTypes.ts";

type DecisionStatus = "DUPLICATE_AUTH_IDENTITY" | "AUTH_REQUIRES_EMAIL";

interface Decision {
  status: DecisionStatus;
  canonical: string;
  reason: string;
}

export type Decisions = ReadonlyMap<string, Decision>;

const STATUS_LABELS: Record<Status, string> = {
  migratable: "MIGRATE",
  "duplicate-auth-identity": "DUPLICATE_AUTH_IDENTITY",
  "auth-requires-email": "AUTH_REQUIRES_EMAIL",
  "duplicate-email": "UNRESOLVED_DUPLICATE_EMAIL",
  "invalid-email": "INVALID_EMAIL",
  "needs-password-reset": "NEEDS_PASSWORD_RESET",
  "email-linked-to-another-record": "EMAIL_LINKED_TO_ANOTHER_RECORD",
};

const DECISION_STATUSES: Record<DecisionStatus, Status> = {
  DUPLICATE_AUTH_IDENTITY: "duplicate-auth-identity",
  AUTH_REQUIRES_EMAIL: "auth-requires-email",
};

export const statusLabel = (status: Status): string => STATUS_LABELS[status];

export const recordPath = (account: ClassifiedAccount): string =>
  `${account.collection}/${account.key}`;

const isDecisionStatus = (value: unknown): value is DecisionStatus =>
  value === "DUPLICATE_AUTH_IDENTITY" || value === "AUTH_REQUIRES_EMAIL";

export const loadDecisions = (path: string | undefined): Decisions => {
  if (!path) return new Map();
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  const decisions = new Map<string, Decision>();
  for (const [record, value] of entriesOf(at(parsed, "records"))) {
    const status = at(value, "status");
    const canonical = at(value, "canonical");
    const reason = at(value, "reason");
    if (!isDecisionStatus(status) || typeof canonical !== "string") {
      throw new Error(`Invalid decision for ${record}`);
    }
    decisions.set(record, {
      status,
      canonical,
      reason: typeof reason === "string" ? reason : "",
    });
  }
  return decisions;
};

export type KnownEmails = ReadonlyMap<string, string>;

const normalizedEmail = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export const collectKnownEmails = async (
  database: Database,
  collections: readonly string[]
): Promise<KnownEmails> => {
  const known = new Map<string, string>();
  for (const collection of collections) {
    const records: unknown = (await database.ref(collection).get()).val();
    for (const [key, record] of entriesOf(records)) {
      if (isObject(record)) {
        known.set(`${collection}/${key}`, normalizedEmail(at(record, "email")));
      }
    }
  }
  return known;
};

export const applyDecisions = (
  accounts: ClassifiedAccount[],
  decisions: Decisions,
  known: KnownEmails = new Map(
    accounts.map((account) => [recordPath(account), account.email])
  )
): ClassifiedAccount[] => {
  for (const [path, decision] of decisions) {
    const email = known.get(path);
    const canonicalEmail = known.get(decision.canonical);
    if (email === undefined || canonicalEmail === undefined) {
      throw new Error(`Decision for ${path} refers to an unknown record`);
    }
    if (email !== canonicalEmail) {
      throw new Error(
        `Decision for ${path} names a canonical record with another email`
      );
    }
    if (decisions.has(decision.canonical) && decision.canonical !== path) {
      throw new Error(
        `Canonical record ${decision.canonical} is itself excluded`
      );
    }
  }
  const remaining = new Map<string, number>();
  accounts
    .filter((account) => !decisions.has(recordPath(account)))
    .forEach((account) =>
      remaining.set(account.email, (remaining.get(account.email) ?? 0) + 1)
    );
  return accounts.map((account) => {
    const decision = decisions.get(recordPath(account));
    if (decision) {
      return {
        ...account,
        status: DECISION_STATUSES[decision.status],
        canonical: decision.canonical,
        reason: decision.reason,
      };
    }
    const resolved =
      account.status === "duplicate-email" &&
      remaining.get(account.email) === 1;
    return {
      ...account,
      status: resolved ? "migratable" : account.status,
      canonical: recordPath(account),
      reason: resolved
        ? "canonical record of a resolved duplicate-email group"
        : account.status === "migratable"
        ? "unique valid email"
        : "",
    };
  });
};

const referencesTo = (
  value: unknown,
  ids: Set<string>,
  field: string
): number =>
  entriesOf(value).filter(([, record]) =>
    ids.has(String(at(record, ...field.split("/"))))
  ).length;

export const findUniqueDuplicateReferences = async (
  database: Database,
  accounts: ClassifiedAccount[]
): Promise<string[]> => {
  const [appointments, reviews] = await Promise.all([
    database.ref("appointments").get(),
    database.ref("reviews").get(),
  ]);
  const problems: string[] = [];
  for (const account of accounts) {
    if (account.status !== "duplicate-auth-identity" || !account.canonical) {
      continue;
    }
    const canonical: unknown = (
      await database.ref(account.canonical).get()
    ).val();
    const own = new Set([String(account.record.id), account.key]);
    own.delete(String(at(canonical, "id")));
    own.delete(account.canonical.split("/")[1] ?? "");
    const isDoctor = account.collection === "doctors";
    const count = isDoctor
      ? referencesTo(appointments.val(), own, "doctorId") +
        referencesTo(reviews.val(), own, "doctorId")
      : referencesTo(appointments.val(), own, "user/id") +
        referencesTo(reviews.val(), own, "userId");
    if (count > 0)
      problems.push(
        `${recordPath(account)} has ${count} references of its own`
      );
  }
  return problems;
};

export const checkDuplicateReferences = async (
  database: Database,
  accounts: ClassifiedAccount[],
  apply: boolean
): Promise<void> => {
  const problems = await findUniqueDuplicateReferences(database, accounts);
  problems.forEach((problem) => console.log(`BLOCKED: ${problem}`));
  if (apply && problems.length > 0) {
    throw new Error("Duplicate records with their own references need review.");
  }
};

export const writePlan = (
  path: string,
  accounts: ClassifiedAccount[]
): void => {
  const rows = accounts.map((account) => ({
    record: recordPath(account),
    collection: account.collection,
    role: resolveRole(
      account.collection,
      isObject(account.record) ? account.record : null
    ),
    status: statusLabel(account.status),
    canonical: account.canonical ?? recordPath(account),
    authEmail: account.status === "migratable" ? account.email : null,
    credentialCleanup:
      account.status === "duplicate-auth-identity" ||
      account.status === "auth-requires-email"
        ? "keep plaintext password until a separate approved cleanup"
        : account.status === "migratable"
        ? "password removed only after verified sign-in"
        : "untouched",
    reason: account.reason ?? "",
  }));
  writeFileSync(path, `${JSON.stringify(rows, null, 2)}\n`);
};

export const optionValue = (name: string): string | undefined =>
  process.argv
    .slice(2)
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

export const maskEmail = (email: string): string => {
  const [name, domain] = String(email).split("@");
  return `${(name ?? "").slice(0, 2)}***@${domain || "?"}`;
};

export const describePlan = (account: ClassifiedAccount): string =>
  [
    "create the Firebase Auth user with the existing password (an existing login is never changed)",
    "verify sign-in with it",
    `set ${account.collection}/${account.key}/authUid`,
    "add authLinks/<uid>",
    `remove ${account.collection}/${account.key}/password`,
    "leave every other field unchanged",
  ].join("; ");
