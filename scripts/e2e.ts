import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import {
  assertEmulatorOnly,
  BASE_URL,
  E2E_PORT,
  emulatorEnv,
} from "./e2e/env.ts";
import {
  closeEmulatorAdmin,
  readPath,
  resetEmulatorData,
} from "./e2e/emulatorAdmin.ts";
import { expectThat, summarize } from "./e2e/harness.ts";
import {
  checkAdminAuthorization,
  checkAdminFeatures,
  checkPublicRegistration,
} from "./e2e/checksAdmin.ts";
import {
  checkLegacyMigrationLogin,
  checkRoleLogins,
  checkShortPasswordResetFlow,
} from "./e2e/checksAuth.ts";
import {
  checkBookingFlow,
  checkDoctorDashboard,
  checkPatientDashboard,
  checkReviewFlow,
} from "./e2e/checksBooking.ts";
import {
  checkDatabaseRules,
  checkPublicPages,
  checkRedirectsAndSeoFiles,
} from "./e2e/checksPublic.ts";
import {
  checkBookingRaces,
  checkLegacyPasswordCannotOverrideNewLogin,
  checkRequestHardening,
} from "./e2e/checksHardening.ts";
import { checkSeoAndGeo } from "./e2e/checksSeoGeo.ts";
import { checkPasswordChangeAndLogout } from "./e2e/checksSession.ts";
import { checkSharedEmailSafety } from "./e2e/checksSharedEmail.ts";
import {
  checkLegacyDoctorProfileSave,
  checkLegacyLogins,
  checkLegacyPatientFlows,
  checkLegacyPublicData,
} from "./e2e/checksLegacy.ts";
import { checkUploadSigning } from "./e2e/checksUploads.ts";
import {
  checkReadOnlyModeWithoutServiceAccount,
  checkWholeDatabasePreserved,
} from "./e2e/checksPreservation.ts";

const runNext = (args: string[]): ChildProcess =>
  spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
    env: { ...process.env, ...emulatorEnv, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "inherit", "inherit"],
  });

const waitForExit = (child: ChildProcess): Promise<void> =>
  new Promise<void>((resolve, reject) =>
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`exit ${code}`))
    )
  );

const waitForServer = async (): Promise<void> => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/robots.txt`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Next.js server did not start");
};

const checkDataPreserved = async (): Promise<void> => {
  const expectedRecords = [
    "users/-Npatient1",
    "users/-Npatient2",
    "users/-Npromoted",
    "admin/-Nadmin1",
    "doctors/-Ndoctor1",
    "doctors/-Ndoctor2",
    "services/-Nservice1",
    "services/-Nservice2",
    "reviews/-Nreview1",
    "reviews/-Nreview2",
    "appointments/app1000existing",
    "appointments/app2000other",
  ];
  for (const path of expectedRecords) {
    expectThat(
      `existing record preserved: ${path}`,
      Boolean(await readPath(path))
    );
  }
  expectThat(
    "accounts that never logged in keep their data untouched",
    (await readPath("doctors/-Ndoctor2/password")) === "Doctor234" &&
      !(await readPath("doctors/-Ndoctor2/authUid"))
  );
};

const main = async (): Promise<void> => {
  process.env = { ...process.env, ...emulatorEnv };
  assertEmulatorOnly();
  await resetEmulatorData();

  if (process.argv.includes("--build")) {
    rmSync(".next/cache/fetch-cache", { recursive: true, force: true });
    await waitForExit(runNext(["build"]));
  }
  const server = runNext(["start", "-p", String(E2E_PORT)]);

  try {
    await waitForServer();
    await checkDatabaseRules();
    await checkPublicPages();
    await checkRedirectsAndSeoFiles();
    await checkSeoAndGeo();
    await checkRequestHardening();

    const patient = await checkLegacyMigrationLogin();
    const { doctor, admin } = await checkRoleLogins();
    await checkShortPasswordResetFlow();

    const bookedKey = await checkBookingFlow(patient, doctor);
    await checkReviewFlow(patient, doctor);
    await checkPatientDashboard(patient, doctor, bookedKey);
    await checkDoctorDashboard(doctor, patient, bookedKey);

    await checkAdminAuthorization(patient, doctor);
    await checkAdminFeatures(admin);
    await checkPublicRegistration();
    await checkPasswordChangeAndLogout(patient);

    await checkLegacyPublicData();
    const legacy = await checkLegacyLogins();
    await checkLegacyPatientFlows(legacy.patient);
    await checkBookingRaces(legacy.patient);
    await checkLegacyPasswordCannotOverrideNewLogin();
    await checkLegacyDoctorProfileSave(legacy.doctor);
    await checkUploadSigning(legacy.patient);
    await checkSharedEmailSafety();

    await checkDataPreserved();
    await checkWholeDatabasePreserved();
  } finally {
    server.kill();
  }

  try {
    await checkReadOnlyModeWithoutServiceAccount();
  } finally {
    await closeEmulatorAdmin();
  }

  process.exit(summarize() ? 0 : 1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
