import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";
import type { KeyedRecord } from "@/types/firebase";
import { requireServerEnv, serverEnv } from "./env";
import { HttpError } from "./http";

const APP_NAME = "osm-server";

export const NOT_CONFIGURED_MESSAGE =
  "The server is not fully configured yet. Set FIREBASE_SERVICE_ACCOUNT_KEY to enable sign-in and changes.";

export type QueryValue = string | number | boolean | null;

export const hasAdminCredentials = (): boolean =>
  Boolean(
    serverEnv.projectId &&
      serverEnv.databaseUrl &&
      (serverEnv.usesEmulators || serverEnv.serviceAccount)
  );

export const assertAdminConfigured = (): void => {
  if (!hasAdminCredentials()) throw new HttpError(503, NOT_CONFIGURED_MESSAGE);
};

let warnedAboutReadOnlyMode = false;
const warnReadOnlyMode = (): void => {
  if (warnedAboutReadOnlyMode) return;
  warnedAboutReadOnlyMode = true;
  console.warn(
    "[osm] FIREBASE_SERVICE_ACCOUNT_KEY is not set: serving public data read-only. Sign-in and changes are disabled."
  );
};

const createAdminApp = (): App => {
  assertAdminConfigured();
  const projectId = serverEnv.projectId;
  const databaseURL = serverEnv.databaseUrl;

  if (serverEnv.usesEmulators) {
    return initializeApp({ projectId, databaseURL }, APP_NAME);
  }

  const serviceAccount = serverEnv.serviceAccount;
  if (!serviceAccount) throw new HttpError(503, NOT_CONFIGURED_MESSAGE);
  return initializeApp(
    { credential: cert(serviceAccount), projectId, databaseURL },
    APP_NAME
  );
};

const getAdminApp = (): App =>
  getApps().some((app) => app.name === APP_NAME)
    ? getApp(APP_NAME)
    : createAdminApp();

export const getAdminDatabase = (): Database => getDatabase(getAdminApp());

export const getAdminAuth = (): Auth => getAuth(getAdminApp());

class PublicReadError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`Public read of /${path} failed with ${status}`);
    this.status = status;
  }
}

const restUrl = (path: string, params: Record<string, QueryValue> = {}): string => {
  const url = new URL(
    requireServerEnv("FIREBASE_DATABASE_URL", serverEnv.databaseUrl)
  );
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${path}.json`;
  Object.entries(params).forEach(([name, value]) =>
    url.searchParams.set(name, JSON.stringify(value))
  );
  return url.toString();
};

const restRead = async (
  path: string,
  query?: Record<string, QueryValue>
): Promise<unknown> => {
  warnReadOnlyMode();
  const response = await fetch(restUrl(path, query), { cache: "no-store" });
  if (!response.ok) throw new PublicReadError(path, response.status);
  return response.json();
};

const isRecordObject = (value: unknown): value is object =>
  Boolean(value) && typeof value === "object";

const toEntries = <T>(value: unknown): KeyedRecord<T>[] =>
  Object.entries((value as Record<string, unknown> | null) ?? {})
    .filter((entry): entry is [string, object] => isRecordObject(entry[1]))
    .map(([key, record]) => ({ key, record: record as T }));

export const readValue = async <T>(path: string): Promise<T | null> => {
  if (!hasAdminCredentials()) return (await restRead(path)) as T | null;
  const snapshot = await getAdminDatabase().ref(path).get();
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

export const readCollection = async <T>(path: string): Promise<KeyedRecord<T>[]> =>
  toEntries<T>(await readValue<unknown>(path));

const childValue = (record: unknown, child: string): unknown =>
  child
    .split("/")
    .reduce<unknown>(
      (current, part) =>
        isRecordObject(current)
          ? (current as Record<string, unknown>)[part]
          : undefined,
      record
    );

export const queryByChild = async <T>(
  path: string,
  child: string,
  value: QueryValue
): Promise<KeyedRecord<T>[]> => {
  if (!hasAdminCredentials()) {
    try {
      return toEntries<T>(await restRead(path, { orderBy: child, equalTo: value }));
    } catch (error) {
      if (!(error instanceof PublicReadError) || error.status !== 400) throw error;
      return (await readCollection<T>(path)).filter(
        ({ record }) => childValue(record, child) === value
      );
    }
  }
  const snapshot = await getAdminDatabase()
    .ref(path)
    .orderByChild(child)
    .equalTo(value)
    .get();
  return toEntries<T>(snapshot.val());
};

const idVariants = (value: string): QueryValue[] =>
  /^\d{1,15}$/.test(value) ? [value, Number(value)] : [value];

export const queryByChildVariants = async <T>(
  path: string,
  child: string,
  value: string
): Promise<KeyedRecord<T>[]> => {
  const results = await Promise.all(
    idVariants(value).map((variant) => queryByChild<T>(path, child, variant))
  );
  const seen = new Set<string>();
  return results.flat().filter(({ key }) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
