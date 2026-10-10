import "server-only";
import { requireServerEnv, serverEnv } from "./env";

const INVALID_CREDENTIAL_CODES = new Set([
  "EMAIL_NOT_FOUND",
  "INVALID_PASSWORD",
  "INVALID_LOGIN_CREDENTIALS",
]);

export class IdentityToolkitError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }

  get isInvalidCredential(): boolean {
    return INVALID_CREDENTIAL_CODES.has(this.code);
  }
}

interface IdentityToolkitErrorBody {
  error?: { message?: string };
}

interface SignInResponseBody {
  idToken: string;
  localId: string;
}

export interface SignInResult {
  idToken: string;
  uid: string;
}

const endpoint = (method: string): string => {
  const apiKey = requireServerEnv("FIREBASE_WEB_API_KEY", serverEnv.webApiKey);
  const base = serverEnv.authEmulatorHost
    ? `http://${serverEnv.authEmulatorHost}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  return `${base}/v1/accounts:${method}?key=${encodeURIComponent(apiKey)}`;
};

const post = async <T>(method: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(endpoint(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as IdentityToolkitErrorBody).error?.message;
    const code = String(message || "UNKNOWN").split(" ")[0] ?? "UNKNOWN";
    throw new IdentityToolkitError(code);
  }
  return data as T;
};

export const signInWithPassword = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  const data = await post<SignInResponseBody>("signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  return { idToken: data.idToken, uid: data.localId };
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  await post<unknown>("sendOobCode", { requestType: "PASSWORD_RESET", email });
};
