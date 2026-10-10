import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { UserRecord } from "firebase-admin/auth";
import type { Account, Role } from "@/types/domain";
import type {
  AccountCollection,
  AccountRecord,
  AuthLinkRecord,
} from "@/types/firebase";
import { collectionSearchOrder, resolveRole } from "../shared/roles";
import {
  getAdminAuth,
  getAdminDatabase,
  queryByChild,
  readCollection,
  readValue,
} from "./firebaseAdmin";

export const firebaseErrorCode = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
};

const digest = (value: string): Buffer =>
  createHash("sha256").update(value).digest();

const equalSecrets = (left: string, right: string): boolean =>
  timingSafeEqual(digest(left), digest(right));

export const isLegacyPassword = (value: unknown): value is string | number =>
  (typeof value === "string" && value.length > 0) ||
  (typeof value === "number" && Number.isFinite(value));

export const passwordsMatch = (stored: unknown, provided: unknown): boolean => {
  if (!isLegacyPassword(stored) || typeof provided !== "string") return false;
  const storedText = String(stored);
  const exact = equalSecrets(storedText, provided);
  const trimmed = equalSecrets(storedText.trim(), provided);
  return exact || trimmed;
};

export const generateRecordId = (): string =>
  randomBytes(8).toString("hex").slice(0, 10);

export const generateTemporaryPassword = (): string =>
  `${randomBytes(24).toString("base64url")}Aa1`;

export const toAccount = <T extends AccountRecord>(
  collection: AccountCollection,
  key: string,
  record: T,
  uid: string | null = null
): Account<T> => ({
  uid: uid || record.authUid || null,
  collection,
  key,
  record,
  role: resolveRole(collection, record),
});

const normalizedEmail = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const dedupeAccounts = (accounts: Account[]): Account[] => {
  const seen = new Set<string>();
  return accounts.filter((account) => {
    const id = `${account.collection}/${account.key}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const scanCollectionByEmail = async (
  collection: AccountCollection,
  email: string
): Promise<Account[]> =>
  (await readCollection<AccountRecord>(collection))
    .filter(({ record }) => normalizedEmail(record.email) === email)
    .map(({ key, record }) => toAccount(collection, key, record));

export const findAccountsByEmail = async (
  email: unknown,
  preferredRole?: Role | null
): Promise<Account[]> => {
  const trimmed = String(email ?? "").trim();
  const target = trimmed.toLowerCase();
  if (!target) return [];
  const variants = [...new Set([trimmed, target])];
  const collections = collectionSearchOrder(preferredRole);

  const indexed = await Promise.all(
    collections.flatMap((collection) =>
      variants.map(async (variant) =>
        (await queryByChild<AccountRecord>(collection, "email", variant)).map(
          ({ key, record }) => toAccount(collection, key, record)
        )
      )
    )
  );
  const found = dedupeAccounts(indexed.flat());
  if (found.length > 0) return found;

  const scanned = await Promise.all(
    collections.map((collection) => scanCollectionByEmail(collection, target))
  );
  return dedupeAccounts(scanned.flat());
};

export const getLinkedAccount = async (uid: string): Promise<Account | null> => {
  const link = await readValue<AuthLinkRecord>(`authLinks/${uid}`);
  if (!link?.collection || !link?.key) return null;
  const record = await readValue<AccountRecord>(`${link.collection}/${link.key}`);
  return record ? toAccount(link.collection, link.key, record, uid) : null;
};

export const linkAccount = (
  uid: string,
  account: Pick<Account, "collection" | "key">,
  source = "firebase-auth"
): Promise<void> =>
  getAdminDatabase()
    .ref()
    .update({
      [`authLinks/${uid}`]: {
        collection: account.collection,
        key: account.key,
        linkedAt: new Date().toISOString(),
        source,
      } satisfies AuthLinkRecord,
      [`${account.collection}/${account.key}/authUid`]: uid,
    });

export const stripLegacyPassword = async (
  account: Account,
  verifiedValue?: string
): Promise<boolean> => {
  if (account.record.password === undefined) return false;
  const result = await getAdminDatabase()
    .ref(`${account.collection}/${account.key}/password`)
    .transaction((current: unknown) => {
      if (current === null) return null;
      const matchesVerified =
        verifiedValue === undefined || passwordsMatch(current, verifiedValue);
      return matchesVerified ? null : undefined;
    });
  if (result.committed) delete account.record.password;
  return result.committed;
};

export const findAuthUserByEmail = async (
  email: string
): Promise<UserRecord | null> => {
  try {
    return await getAdminAuth().getUserByEmail(email);
  } catch (error) {
    if (firebaseErrorCode(error) === "auth/user-not-found") return null;
    throw error;
  }
};

export interface AuthUserResult {
  uid: string;
  created: boolean;
}

export const createAuthUserIfMissing = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUserResult> => {
  const existing = await findAuthUserByEmail(email);
  if (existing) return { uid: existing.uid, created: false };
  try {
    const created = await getAdminAuth().createUser({
      email,
      password,
      ...(displayName ? { displayName } : {}),
    });
    return { uid: created.uid, created: true };
  } catch (error) {
    if (firebaseErrorCode(error) !== "auth/email-already-exists") throw error;
    const raced = await findAuthUserByEmail(email);
    if (!raced) throw error;
    return { uid: raced.uid, created: false };
  }
};

export const adoptAccountByEmail = async (
  uid: string,
  email: string,
  preferredRole?: Role | null
): Promise<Account | null> => {
  const accounts = await findAccountsByEmail(email, preferredRole);
  const candidate = accounts.find(
    (account) => !account.record.authUid || account.record.authUid === uid
  );
  if (!candidate) return null;
  const account = { ...candidate, uid };
  await linkAccount(uid, account);
  return account;
};

export const deleteAccountCompletely = async (account: Account): Promise<void> => {
  const updates: Record<string, null> = {
    [`${account.collection}/${account.key}`]: null,
  };
  if (account.uid) updates[`authLinks/${account.uid}`] = null;
  await getAdminDatabase().ref().update(updates);
  if (account.uid) {
    await getAdminAuth()
      .deleteUser(account.uid)
      .catch((error: unknown) => {
        if (firebaseErrorCode(error) !== "auth/user-not-found") throw error;
      });
  }
};

export const isLinkedToOtherRecord = async (
  email: string,
  account: Pick<Account, "collection" | "key">
): Promise<boolean> => {
  const existing = await findAuthUserByEmail(email);
  if (!existing) return false;
  const link = await readValue<AuthLinkRecord>(`authLinks/${existing.uid}`);
  return Boolean(
    link && (link.collection !== account.collection || link.key !== account.key)
  );
};
