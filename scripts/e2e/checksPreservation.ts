import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { readPath } from "./emulatorAdmin.ts";
import { DATABASE_NAMESPACE, emulatorEnv } from "./env.ts";
import { at, keysOf, stable, textAt } from "../json.ts";
import { expectThat } from "./harness.ts";
import { seedData } from "./seed.ts";

const MIGRATION_FIELDS = ["password", "authUid"];

const INTENDED_CHANGES: Record<string, string[]> = {
  "users/-Npatient1": ["bloodType"],
  "users/0": ["phoneNumber"],
  "doctors/-Ndoctor1": ["bio", "ticketPrice", "qualifications", "experiences"],
  "doctors/-Nnumeric": ["bio"],
  "appointments/app2000other": ["state", "ticketPrice"],
};

export const checkWholeDatabasePreserved = async (): Promise<void> => {
  const before = seedData();
  const after = (await readPath("")) || {};
  const problems: string[] = [];

  for (const [collection, records] of Object.entries(before)) {
    for (const [key, record] of Object.entries(records)) {
      const path = `${collection}/${key}`;
      const current = at(after, collection, key);
      if (!current) {
        problems.push(`${path} disappeared`);
        continue;
      }
      const allowed = [...MIGRATION_FIELDS, ...(INTENDED_CHANGES[path] || [])];
      for (const field of new Set([
        ...keysOf(record),
        ...keysOf(current),
      ])) {
        if (allowed.includes(field)) continue;
        if (stable(at(record, field)) !== stable(at(current, field))) {
          problems.push(`${path}.${field} changed`);
        }
      }
      if (
        at(current, "password") !== undefined &&
        at(current, "password") !== at(record, "password")
      ) {
        problems.push(
          `${path}.password was rewritten instead of kept or removed`
        );
      }
    }
  }

  expectThat(
    "every existing record still exists with its original id",
    !problems.some((p) => p.includes("disappeared")),
    problems.join("; ")
  );
  expectThat(
    "no existing field changed except intended edits and auth migration",
    problems.length === 0,
    problems.join("; ")
  );
};

const setRules = async (rules: unknown): Promise<void> => {
  const response = await fetch(
    `http://${emulatorEnv.FIREBASE_DATABASE_EMULATOR_HOST}/.settings/rules.json?ns=${DATABASE_NAMESPACE}`,
    {
      method: "PUT",
      headers: { Authorization: "Bearer owner" },
      body: JSON.stringify(rules),
    }
  );
  if (!response.ok)
    throw new Error(`Could not change emulator rules: ${response.status}`);
};

const waitFor = async (url: string): Promise<void> => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`${url} did not start`);
};

export const checkReadOnlyModeWithoutServiceAccount = async () => {
  const port = 3101;
  const {
    FIREBASE_AUTH_EMULATOR_HOST: _authEmulatorHost,
    FIREBASE_DATABASE_EMULATOR_HOST: _databaseEmulatorHost,
    FIREBASE_SERVICE_ACCOUNT_KEY: _serviceAccountKey,
    ...inherited
  } = { ...process.env, ...emulatorEnv, NEXT_TELEMETRY_DISABLED: "1" };
  const env: NodeJS.ProcessEnv = {
    ...inherited,
    FIREBASE_DATABASE_URL: `http://${emulatorEnv.FIREBASE_DATABASE_EMULATOR_HOST}/?ns=${DATABASE_NAMESPACE}`,
  };

  const secureRules: unknown = JSON.parse(
    readFileSync("database.rules.json", "utf8")
  );
  await setRules({ rules: { ".read": true, ".write": false } });
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
    {
      env,
      stdio: "ignore",
    }
  );

  try {
    const base = `http://localhost:${port}`;
    await waitFor(`${base}/robots.txt`);
    const page = await fetch(`${base}/services-details?service=Dermatology`);
    const html = await page.text();
    expectThat(
      "without a service account, public pages still render real data read-only",
      page.status === 200 && html.includes("Dr Sara"),
      page.status
    );
    expectThat(
      "read-only mode never leaks passwords or emails",
      !/Doctor123|doctor@example\.com/.test(html)
    );

    const loginResponse = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        email: "doctor2@example.com",
        password: "Doctor234",
        role: "doctor",
      }),
    });
    const body: unknown = await loginResponse.json().catch(() => ({}));
    expectThat(
      "without a service account, sign-in returns a clear 503",
      loginResponse.status === 503 &&
        /FIREBASE_SERVICE_ACCOUNT_KEY/.test(textAt(body, "error")),
      loginResponse.status
    );
    expectThat(
      "read-only mode does not touch legacy passwords",
      (await readPath("doctors/-Ndoctor2/password")) === "Doctor234"
    );
  } finally {
    server.kill();
    await setRules(secureRules);
  }
};
