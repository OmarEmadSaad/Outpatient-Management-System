import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Account, ClientUser, Role, Session } from "@/types/domain";
import { firebaseErrorCode, getLinkedAccount } from "./accounts";
import { normalizeId } from "./data/projections";
import { serverEnv } from "./env";
import { getAdminAuth } from "./firebaseAdmin";
import { HttpError } from "./http";

export const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

const cookieOptions = (maxAgeSeconds: number) =>
  ({
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  }) as const;

const STALE_TOKEN_CODES = new Set([
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/user-token-expired",
]);

const createSessionCookie = async (
  idToken: string,
  refreshIdToken?: () => Promise<string>
): Promise<string> => {
  const options = { expiresIn: SESSION_DURATION_MS };
  try {
    return await getAdminAuth().createSessionCookie(idToken, options);
  } catch (error) {
    const code = firebaseErrorCode(error);
    if (!refreshIdToken || !code || !STALE_TOKEN_CODES.has(code)) throw error;
    return getAdminAuth().createSessionCookie(await refreshIdToken(), options);
  }
};

export const startSession = async (
  idToken: string,
  refreshIdToken?: () => Promise<string>
): Promise<void> => {
  const sessionCookie = await createSessionCookie(idToken, refreshIdToken);
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    sessionCookie,
    cookieOptions(SESSION_DURATION_MS / 1000)
  );
};

export const endSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.set(SESSION_COOKIE, "", cookieOptions(0));
  if (!sessionCookie) return;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    await getAdminAuth().revokeRefreshTokens(decoded.uid);
  } catch {
    return;
  }
};

const toSession = (
  account: Account | null,
  uid: string,
  authTime: number
): Session | null =>
  account && account.role
    ? { ...account, uid, role: account.role, authTime }
    : null;

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return toSession(
      await getLinkedAccount(decoded.uid),
      decoded.uid,
      decoded.auth_time
    );
  } catch {
    return null;
  }
});

export const requirePageSession = async (
  allowedRoles: readonly Role[]
): Promise<Session> => {
  const session = await getSession();
  if (!session || !allowedRoles.includes(session.role)) redirect("/login");
  return session;
};

export const requireApiSession = async (
  allowedRoles?: readonly Role[]
): Promise<Session> => {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Please log in to continue.");
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new HttpError(403, "You do not have permission to do this.");
  }
  return session;
};

export const toClientUser = (
  account: Pick<Account, "role" | "key" | "record"> | null
): ClientUser | null =>
  account && account.role
    ? {
        role: account.role,
        userId: account.key,
        recordId: normalizeId(account.record.id, account.key),
        name: account.record.name || "",
        photo: account.record.photo || "",
      }
    : null;
