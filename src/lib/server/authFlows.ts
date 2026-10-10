import "server-only";
import type { Account, Role } from "@/types/domain";
import type { AccountRecord, AuthLinkRecord, DoctorRecord } from "@/types/firebase";
import {
  canRegisterRole,
  collectionForNewAccount,
  isRole,
  ROLES,
} from "../shared/roles";
import {
  cleanText,
  isValidEmail,
  normalizeEmail,
  parseTicketPrice,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationInput,
} from "../shared/validation";
import {
  adoptAccountByEmail,
  createAuthUserIfMissing,
  findAccountsByEmail,
  findAuthUserByEmail,
  generateRecordId,
  generateTemporaryPassword,
  getLinkedAccount,
  isLinkedToOtherRecord,
  linkAccount,
  passwordsMatch,
  stripLegacyPassword,
  toAccount,
} from "./accounts";
import { getAdminAuth, getAdminDatabase } from "./firebaseAdmin";
import { HttpError } from "./http";
import {
  IdentityToolkitError,
  sendPasswordResetEmail,
  signInWithPassword,
  type SignInResult,
} from "./identityToolkit";

export const DEFAULT_PHOTO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Avj4TSMtuTPrA1IqGtlWogrd6D3aZhVwCA98c3NC442QLQU0rmqWv7M&s";

const INVALID_CREDENTIALS = "Invalid email or password.";
const MIN_FIREBASE_PASSWORD_LENGTH = 6;

export class RegistrationError extends HttpError {
  readonly errors: RegistrationErrors;

  constructor(errors: RegistrationErrors) {
    super(400, Object.values(errors)[0] ?? "Invalid registration.");
    this.errors = errors;
  }
}

const signInOrNull = async (
  email: string,
  password: string
): Promise<SignInResult | null> => {
  try {
    return await signInWithPassword(email, password);
  } catch (error) {
    if (!(error instanceof IdentityToolkitError)) throw error;
    if (error.isInvalidCredential) return null;
    if (error.code === "USER_DISABLED") {
      throw new HttpError(403, "This account has been disabled.");
    }
    if (error.code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
      throw new HttpError(429, "Too many attempts. Please try again later.");
    }
    throw error;
  }
};

const migrateLegacyAccount = async (
  email: string,
  password: string,
  role: Role
): Promise<SignInResult> => {
  const accounts = await findAccountsByEmail(email, role);
  const legacy = accounts.find((account) =>
    passwordsMatch(account.record.password, password)
  );
  if (!legacy) throw new HttpError(401, INVALID_CREDENTIALS);

  if (password.length < MIN_FIREBASE_PASSWORD_LENGTH) {
    throw new HttpError(
      409,
      'Your account needs a new password. Please use "Forgot password" to reset it.'
    );
  }

  const authEmail = normalizeEmail(email);
  if (await isLinkedToOtherRecord(authEmail, legacy)) {
    throw new HttpError(
      409,
      "This email is already used by another account. Please sign in with that account's password or contact the clinic."
    );
  }
  const { uid } = await createAuthUserIfMissing(
    authEmail,
    password,
    legacy.record.name
  );
  const verified = await signInOrNull(authEmail, password);
  if (!verified || verified.uid !== uid) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }
  await linkAccount(uid, legacy, "legacy-password-migration");
  await stripLegacyPassword(legacy, password);
  return verified;
};

export interface LoginInput {
  email: unknown;
  password: unknown;
  role: unknown;
}

export interface LoginResult {
  idToken: string;
  account: Account;
  refreshIdToken: () => Promise<string>;
}

export const loginWithPassword = async ({
  email,
  password,
  role,
}: LoginInput): Promise<LoginResult> => {
  if (!isValidEmail(email) || typeof password !== "string" || !password) {
    throw new HttpError(400, "Please enter your email and password.");
  }
  if (!isRole(role)) {
    throw new HttpError(400, "Invalid role selected. Please choose a valid role.");
  }

  const trimmedPassword = password.trim();
  const credentials =
    (await signInOrNull(normalizeEmail(email), trimmedPassword)) ??
    (await migrateLegacyAccount(email, trimmedPassword, role));

  const account =
    (await getLinkedAccount(credentials.uid)) ??
    (await adoptAccountByEmail(credentials.uid, email, role));

  if (!account) {
    throw new HttpError(403, "No clinic profile is linked to this account.");
  }

  await stripLegacyPassword(account);

  if (account.role !== role) {
    throw new HttpError(
      403,
      `Invalid role selected. This user is a ${account.role}. Please select the correct role.`
    );
  }

  const refreshIdToken = async (): Promise<string> =>
    (await signInWithPassword(normalizeEmail(email), trimmedPassword)).idToken;

  return { idToken: credentials.idToken, account, refreshIdToken };
};

interface ValidRegistration extends RegistrationInput {
  name: string;
  email: string;
  password: string;
  gender: string;
}

const buildNewRecord = (
  input: ValidRegistration,
  role: Role,
  uid: string
): AccountRecord => {
  const base: AccountRecord = {
    id: generateRecordId(),
    name: cleanText(input.name, 100),
    email: normalizeEmail(input.email),
    photo: typeof input.photo === "string" && input.photo ? input.photo : DEFAULT_PHOTO_URL,
    gender: input.gender,
    role,
    authUid: uid,
  };
  if (role !== ROLES.doctor) return base;
  const doctor: DoctorRecord = {
    ...base,
    phone: cleanText(input.phone, 20),
    specialization: cleanText(input.specialization, 80),
    ticketPrice: parseTicketPrice(input.ticketPrice) ?? 0,
  };
  return doctor;
};

export const registerAccount = async (
  input: RegistrationInput,
  actorRole: Role | null
): Promise<Account> => {
  const role = input.role;
  if (!isRole(role) || !canRegisterRole(role, actorRole)) {
    throw new HttpError(403, "You are not allowed to create this type of account.");
  }

  const errors = validateRegistration(input);
  if (Object.keys(errors).length > 0) throw new RegistrationError(errors);
  const valid = input as ValidRegistration;

  const email = normalizeEmail(valid.email);
  const [existingAccounts, existingAuthUser] = await Promise.all([
    findAccountsByEmail(email, role),
    findAuthUserByEmail(email),
  ]);
  if (existingAccounts.length > 0 || existingAuthUser) {
    throw new HttpError(409, "This email is already registered.");
  }

  const created = await getAdminAuth().createUser({
    email,
    password: valid.password.trim(),
    displayName: cleanText(valid.name, 100),
  });

  const collection = collectionForNewAccount(role);
  const database = getAdminDatabase();
  const key = database.ref(collection).push().key;
  if (!key) throw new Error("Could not allocate a record key");
  const record = buildNewRecord(valid, role, created.uid);

  try {
    await database.ref().update({
      [`${collection}/${key}`]: record,
      [`authLinks/${created.uid}`]: {
        collection,
        key,
        linkedAt: new Date().toISOString(),
      } satisfies AuthLinkRecord,
    });
  } catch (error) {
    await getAdminAuth().deleteUser(created.uid);
    throw error;
  }

  return toAccount(collection, key, record, created.uid);
};

export const requestPasswordReset = async (email: unknown): Promise<void> => {
  if (!isValidEmail(email)) return;

  const normalized = normalizeEmail(email);
  const existingAuthUser = await findAuthUserByEmail(normalized);

  if (!existingAuthUser) {
    const accounts = await findAccountsByEmail(email);
    const account = accounts.find((candidate) => !candidate.record.authUid);
    if (!account) return;
    const created = await getAdminAuth().createUser({
      email: normalized,
      password: generateTemporaryPassword(),
      ...(account.record.name ? { displayName: account.record.name } : {}),
    });
    await linkAccount(created.uid, account);
  }

  await sendPasswordResetEmail(normalized);
};
