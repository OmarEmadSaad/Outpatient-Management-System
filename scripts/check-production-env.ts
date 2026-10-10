import { at } from "./json.ts";

type Level = "PASS" | "WARN" | "FAIL";

interface CheckResult {
  level: Level;
  name: string;
  message: string;
}

interface ServiceAccountSummary {
  type?: unknown;
  projectId?: unknown;
  clientEmail?: unknown;
  privateKey?: unknown;
  invalidJson?: boolean;
}

const env = process.env;
const results: CheckResult[] = [];

const report = (level: Level, name: string, message: string): void => {
  results.push({ level, name, message });
};
const pass = (name: string, message: string): void =>
  report("PASS", name, message);
const warn = (name: string, message: string): void =>
  report("WARN", name, message);
const fail = (name: string, message: string): void =>
  report("FAIL", name, message);

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const checkProject = () => {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return fail("FIREBASE_PROJECT_ID", "missing");
  if (projectId.startsWith("demo-")) {
    return fail("FIREBASE_PROJECT_ID", "points to an emulator demo project");
  }
  pass("FIREBASE_PROJECT_ID", "set");
};

const checkDatabaseUrl = () => {
  const url = env.FIREBASE_DATABASE_URL;
  if (!url) return fail("FIREBASE_DATABASE_URL", "missing");
  const host = isHttpsUrl(url) ? new URL(url).host : "";
  if (!/\.(firebaseio\.com|firebasedatabase\.app)$/.test(host)) {
    return fail(
      "FIREBASE_DATABASE_URL",
      "must be the https Realtime Database URL"
    );
  }
  if (env.FIREBASE_PROJECT_ID && !host.startsWith(env.FIREBASE_PROJECT_ID)) {
    warn(
      "FIREBASE_DATABASE_URL",
      "host does not start with the project id; double-check it"
    );
    return;
  }
  pass("FIREBASE_DATABASE_URL", "valid");
};

const checkWebApiKey = () => {
  const key = env.FIREBASE_WEB_API_KEY;
  if (!key)
    return fail("FIREBASE_WEB_API_KEY", "missing (needed for server sign-in)");
  if (!/^AIza[0-9A-Za-z_-]{35}$/.test(key)) {
    return warn("FIREBASE_WEB_API_KEY", "does not look like a Google API key");
  }
  pass("FIREBASE_WEB_API_KEY", "format ok");
};

const readServiceAccount = (): ServiceAccountSummary | null => {
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed: unknown = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (parsed === null) return { invalidJson: true };
      return {
        type: at(parsed, "type"),
        projectId: at(parsed, "project_id"),
        clientEmail: at(parsed, "client_email"),
        privateKey: at(parsed, "private_key"),
      };
    } catch {
      return { invalidJson: true };
    }
  }
  if (env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_PRIVATE_KEY) {
    return {
      type: "service_account",
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
  }
  return null;
};

const checkServiceAccount = () => {
  const account = readServiceAccount();
  const name = "FIREBASE_SERVICE_ACCOUNT_KEY";
  if (!account) {
    return fail(
      name,
      "missing: the app will run read-only and sign-in will be disabled"
    );
  }
  if (account.invalidJson)
    return fail(
      name,
      "is not valid JSON (paste the whole key file on one line)"
    );
  if (account.type !== "service_account")
    return fail(name, "is not a service-account key");
  if (
    !/@.+\.iam\.gserviceaccount\.com$/.test(String(account.clientEmail || ""))
  ) {
    return fail(name, "client_email is not a service-account address");
  }
  if (
    !/-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/.test(
      String(account.privateKey || "")
    )
  ) {
    return fail(name, "private_key is missing or has broken line breaks");
  }
  if (
    env.FIREBASE_PROJECT_ID &&
    account.projectId !== env.FIREBASE_PROJECT_ID
  ) {
    return fail(name, "belongs to a different Firebase project");
  }
  pass(name, "valid and matches the project");
};

const checkNoEmulators = () => {
  const emulatorVars = [
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_DATABASE_EMULATOR_HOST",
  ].filter((name) => env[name]);
  if (emulatorVars.length > 0) {
    return fail(
      emulatorVars.join(", "),
      "emulator hosts must not be set in production"
    );
  }
  pass("emulator variables", "not set");
};

const checkSiteUrl = () => {
  const url = env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    return warn(
      "NEXT_PUBLIC_SITE_URL",
      "missing: canonical URLs fall back to the Vercel production URL"
    );
  }
  if (!isHttpsUrl(url) || new URL(url).pathname !== "/") {
    return fail(
      "NEXT_PUBLIC_SITE_URL",
      "must be an https origin such as https://clinic.example.com"
    );
  }
  pass("NEXT_PUBLIC_SITE_URL", "valid");
};

const checkCloudinary = () => {
  if (!env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    fail(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      "missing: image uploads will not work"
    );
  } else {
    pass("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "set");
  }
  const hasKey = Boolean(env.CLOUDINARY_API_KEY);
  const hasSecret = Boolean(env.CLOUDINARY_API_SECRET);
  if (hasKey !== hasSecret) {
    return fail("CLOUDINARY_API_KEY/SECRET", "set both or neither");
  }
  if (!hasKey) {
    return fail(
      "CLOUDINARY_API_KEY/SECRET",
      "missing: uploads would fall back to the public unsigned preset"
    );
  }
  pass("CLOUDINARY_API_KEY/SECRET", "signed uploads enabled");
};

const checkClinic = () => {
  const address = [
    env.CLINIC_STREET_ADDRESS,
    env.CLINIC_CITY,
    env.CLINIC_COUNTRY,
  ];
  if (address.some((value) => value?.trim())) {
    if (!address.every((value) => value?.trim())) {
      return fail(
        "CLINIC_STREET_ADDRESS/CITY/COUNTRY",
        "set all three or none"
      );
    }
  } else {
    warn(
      "CLINIC_* address",
      "missing: search engines get no local clinic address"
    );
  }
  const coordinates = [env.CLINIC_LATITUDE, env.CLINIC_LONGITUDE];
  const setCoordinates = coordinates.filter((value) => value?.trim());
  if (
    setCoordinates.length === 1 ||
    setCoordinates.some((value) => !Number.isFinite(Number(value)))
  ) {
    return fail("CLINIC_LATITUDE/LONGITUDE", "set both as numbers or neither");
  }
  if (!env.CLINIC_PHONE?.trim()) {
    return warn("CLINIC_PHONE", "missing: no phone number in structured data");
  }
  pass("CLINIC_*", "local business details set");
};

const checkNoPublicSecrets = () => {
  const leaked = Object.keys(env).filter(
    (name) =>
      name.startsWith("NEXT_PUBLIC_") &&
      /SECRET|PRIVATE|SERVICE_ACCOUNT|PASSWORD/i.test(name)
  );
  if (leaked.length > 0) {
    return fail(
      leaked.join(", "),
      "secrets must never use the NEXT_PUBLIC_ prefix"
    );
  }
  pass("NEXT_PUBLIC_* variables", "no secret-looking names");
};

[
  checkProject,
  checkDatabaseUrl,
  checkWebApiKey,
  checkServiceAccount,
  checkNoEmulators,
  checkSiteUrl,
  checkCloudinary,
  checkClinic,
  checkNoPublicSecrets,
].forEach((check) => check());

results.forEach(({ level, name, message }) =>
  console.log(`${level.padEnd(4)}  ${name}: ${message}`)
);
const failures = results.filter((result) => result.level === "FAIL").length;
console.log(
  failures
    ? `\n${failures} problem(s) must be fixed before deploying.`
    : "\nProduction environment looks complete."
);
process.exit(failures ? 1 : 0);
