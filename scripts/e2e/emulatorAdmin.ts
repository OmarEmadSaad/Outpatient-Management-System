import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { assertEmulatorOnly, emulatorEnv } from "./env.ts";
import { seedData } from "./seed.ts";

Object.assign(process.env, {
  FIREBASE_AUTH_EMULATOR_HOST: emulatorEnv.FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_DATABASE_EMULATOR_HOST: emulatorEnv.FIREBASE_DATABASE_EMULATOR_HOST,
  FIREBASE_PROJECT_ID: emulatorEnv.FIREBASE_PROJECT_ID,
});
assertEmulatorOnly();

const app = initializeApp(
  {
    projectId: emulatorEnv.FIREBASE_PROJECT_ID,
    databaseURL: emulatorEnv.FIREBASE_DATABASE_URL,
  },
  "e2e-emulator"
);

export const database = getDatabase(app);
export const auth = getAuth(app);

export const readPath = async (path: string): Promise<unknown> => {
  const snapshot = await (path ? database.ref(path) : database.ref()).get();
  const value: unknown = snapshot.val();
  return value;
};

const clearAuthUsers = async (): Promise<void> => {
  const { users } = await auth.listUsers(1000);
  if (users.length) await auth.deleteUsers(users.map((user) => user.uid));
};

export const resetEmulatorData = async (): Promise<void> => {
  assertEmulatorOnly();
  await clearAuthUsers();
  await database.ref().set(seedData());
};

export const closeEmulatorAdmin = (): Promise<void> => deleteApp(app);
