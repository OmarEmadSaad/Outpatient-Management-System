import { readPath } from "./emulatorAdmin.ts";
import { at, textAt } from "../json.ts";
import { createClient, expectThat, login } from "./harness.ts";
import { LEGACY_FIXTURE_PASSWORDS as PW } from "./legacySeed.ts";

export const checkSharedEmailSafety = async (): Promise<void> => {
  const doctorLogin = await login(
    createClient("shared-doctor"),
    "shared@example.com",
    PW.sharedDoctor,
    "doctor"
  );
  expectThat(
    "doctor sharing an email with a patient migrates",
    doctorLogin.status === 200,
    doctorLogin.text
  );
  const doctorUid = await readPath("doctors/-Nshared/authUid");

  const patientLogin = await login(
    createClient("shared-patient"),
    "shared@example.com",
    PW.sharedPatient,
    "patient"
  );
  expectThat(
    "second record with the same email cannot hijack the migrated login",
    patientLogin.status === 409 &&
      /already used by another account/.test(
        textAt(patientLogin.json, "error")
      ),
    patientLogin.text
  );

  const link = await readPath(`authLinks/${doctorUid}`);
  expectThat(
    "login mapping still points to the doctor record",
    at(link, "collection") === "doctors" && at(link, "key") === "-Nshared"
  );
  expectThat(
    "patient record with the shared email is left untouched",
    (await readPath("users/-Nshared/password")) === PW.sharedPatient &&
      !(await readPath("users/-Nshared/authUid"))
  );

  const again = await login(
    createClient("shared-doctor-2"),
    "shared@example.com",
    PW.sharedDoctor,
    "doctor"
  );
  expectThat(
    "doctor can still sign in after the blocked attempt",
    again.status === 200,
    again.text
  );
};
