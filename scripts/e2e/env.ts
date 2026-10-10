export const E2E_PORT = 3100;
export const BASE_URL = `http://localhost:${E2E_PORT}`;
export const PROJECT_ID = "demo-osm";
export const DATABASE_NAMESPACE = `${PROJECT_ID}-default-rtdb`;

export const emulatorEnv = {
  FIREBASE_PROJECT_ID: PROJECT_ID,
  FIREBASE_DATABASE_URL: `https://${DATABASE_NAMESPACE}.firebaseio.com`,
  FIREBASE_WEB_API_KEY: "demo-api-key",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_DATABASE_EMULATOR_HOST: "127.0.0.1:9000",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "demo",
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: "demo",
  CLOUDINARY_API_KEY: "123456789012345",
  CLOUDINARY_API_SECRET: "e2e-cloudinary-secret",
};

export const assertEmulatorOnly = (
  env: NodeJS.ProcessEnv = process.env
): void => {
  const projectId = env.FIREBASE_PROJECT_ID || emulatorEnv.FIREBASE_PROJECT_ID;
  if (!projectId.startsWith("demo-")) {
    throw new Error(
      "Refusing to run: e2e tests only run against a demo- project."
    );
  }
  if (
    !env.FIREBASE_DATABASE_EMULATOR_HOST ||
    !env.FIREBASE_AUTH_EMULATOR_HOST
  ) {
    throw new Error(
      "Refusing to run: Firebase emulator hosts are not configured."
    );
  }
};

export const databaseRestUrl = (path: string): string =>
  `http://${emulatorEnv.FIREBASE_DATABASE_EMULATOR_HOST}/${path}.json?ns=${DATABASE_NAMESPACE}`;
