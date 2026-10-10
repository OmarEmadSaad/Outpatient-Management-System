import "server-only";

export interface ServiceAccountCredentials {
  projectId: string | undefined;
  clientEmail: string;
  privateKey: string;
}

interface ServiceAccountJson {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

const readServiceAccount = (): ServiceAccountCredentials | null => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (json) {
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields");
    }
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  return null;
};

export const serverEnv = {
  get projectId(): string | undefined {
    return process.env.FIREBASE_PROJECT_ID;
  },
  get databaseUrl(): string | undefined {
    return process.env.FIREBASE_DATABASE_URL;
  },
  get webApiKey(): string | undefined {
    return process.env.FIREBASE_WEB_API_KEY;
  },
  get authEmulatorHost(): string | undefined {
    return process.env.FIREBASE_AUTH_EMULATOR_HOST;
  },
  get usesEmulators(): boolean {
    return Boolean(
      process.env.FIREBASE_AUTH_EMULATOR_HOST &&
        process.env.FIREBASE_DATABASE_EMULATOR_HOST
    );
  },
  get serviceAccount(): ServiceAccountCredentials | null {
    return readServiceAccount();
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};

export const requireServerEnv = (
  name: string,
  value: string | undefined
): string => {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
};
