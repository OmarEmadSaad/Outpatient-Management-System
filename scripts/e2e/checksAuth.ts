import { auth, readPath } from "./emulatorAdmin.ts";
import { at, textAt } from "../json.ts";
import { createClient, expectThat, login } from "./harness.ts";
import type { Client } from "./harness.ts";
import { LEGACY_PASSWORDS } from "./seed.ts";

const authUserExists = (email: string): Promise<boolean> =>
  auth.getUserByEmail(email).then(
    () => true,
    () => false
  );

export const checkLegacyMigrationLogin = async (): Promise<Client> => {
  const anonymous = createClient("anonymous");

  const wrongPassword = await login(
    anonymous,
    "patient@example.com",
    "WrongPass1",
    "patient"
  );
  expectThat(
    "wrong password is rejected",
    wrongPassword.status === 401,
    wrongPassword.status
  );
  expectThat(
    "wrong password does not reveal whether the email exists",
    at(wrongPassword.json, "error") === "Invalid email or password."
  );
  expectThat(
    "failed login leaves legacy password untouched",
    (await readPath("users/-Npatient1/password")) === LEGACY_PASSWORDS.patient
  );

  const unknown = await login(
    anonymous,
    "nobody@example.com",
    "Whatever123",
    "patient"
  );
  expectThat(
    "unknown email gets the same generic error",
    unknown.status === 401 &&
      at(unknown.json, "error") === "Invalid email or password."
  );

  const patient = createClient("patient");
  const response = await login(
    patient,
    "patient@example.com",
    LEGACY_PASSWORDS.patient,
    "patient"
  );
  expectThat(
    "legacy patient can log in with existing password",
    response.status === 200,
    response.text
  );
  expectThat("login sets an httpOnly session cookie", Boolean(patient.cookie));
  expectThat(
    "login response contains no password or email",
    !/password|patient@example\.com/i.test(response.text),
    response.text
  );

  const record = await readPath("users/-Npatient1");
  expectThat(
    "migration removes plaintext password from the record",
    at(record, "password") === undefined
  );
  expectThat(
    "migration keeps all other profile fields",
    at(record, "name") === "Test Patient" &&
      at(record, "bloodType") === "A+" &&
      at(record, "id") === "u1a2"
  );
  expectThat(
    "migration links the record to Firebase Auth",
    Boolean(at(record, "authUid")) &&
      Boolean(await readPath(`authLinks/${at(record, "authUid")}`))
  );
  expectThat(
    "Firebase Auth user was created",
    await authUserExists("patient@example.com")
  );

  const again = createClient("patient-again");
  const secondLogin = await login(
    again,
    "patient@example.com",
    LEGACY_PASSWORDS.patient,
    "patient"
  );
  expectThat(
    "migrated patient logs in through Firebase Auth",
    secondLogin.status === 200,
    secondLogin.text
  );

  const wrongRole = await login(
    createClient("x"),
    "patient@example.com",
    LEGACY_PASSWORDS.patient,
    "doctor"
  );
  expectThat(
    "selecting the wrong role is rejected",
    wrongRole.status === 403 &&
      textAt(wrongRole.json, "error").includes("This user is a patient"),
    wrongRole.text
  );

  const me = await patient.get("/api/auth/me");
  expectThat(
    "/api/auth/me returns the server-derived role",
    at(me.json, "user", "role") === "patient" &&
      at(me.json, "user", "userId") === "-Npatient1"
  );
  expectThat(
    "/api/auth/me exposes no password or email",
    !/password|@example\.com/.test(me.text),
    me.text
  );

  return patient;
};

export const checkRoleLogins = async (): Promise<{
  doctor: Client;
  admin: Client;
}> => {
  const doctor = createClient("doctor");
  const doctorLogin = await login(
    doctor,
    "doctor@example.com",
    LEGACY_PASSWORDS.doctor,
    "doctor"
  );
  expectThat(
    "legacy doctor can log in",
    doctorLogin.status === 200,
    doctorLogin.text
  );
  expectThat(
    "doctor password removed after migration",
    (await readPath("doctors/-Ndoctor1/password")) == null
  );
  expectThat(
    "doctor profile preserved after migration",
    (await readPath("doctors/-Ndoctor1/specialization")) === "Dermatology"
  );

  const admin = createClient("admin");
  const adminLogin = await login(
    admin,
    "admin@example.com",
    LEGACY_PASSWORDS.admin,
    "admin"
  );
  expectThat(
    "legacy admin (admin collection) can log in",
    adminLogin.status === 200,
    adminLogin.text
  );

  const promoted = createClient("promoted");
  const promotedLogin = await login(
    promoted,
    "promoted@example.com",
    LEGACY_PASSWORDS.promotedAdmin,
    "admin"
  );
  expectThat(
    "admin promoted inside users collection can log in as admin",
    promotedLogin.status === 200,
    promotedLogin.text
  );

  return { doctor, admin };
};

export const checkShortPasswordResetFlow = async (): Promise<void> => {
  const client = createClient("short");
  const response = await login(
    client,
    "short@example.com",
    LEGACY_PASSWORDS.shortPatient,
    "patient"
  );
  expectThat(
    "legacy password too short for Firebase Auth asks for reset",
    response.status === 409 &&
      textAt(response.json, "error").includes("Forgot password"),
    response.text
  );
  expectThat(
    "short legacy password is not stripped before reset",
    (await readPath("users/-Npatient2/password")) ===
      LEGACY_PASSWORDS.shortPatient
  );

  const reset = await client.post("/api/auth/password-reset", {
    email: "short@example.com",
  });
  expectThat(
    "password reset responds generically",
    reset.status === 200 &&
      textAt(reset.json, "message").includes("If an account exists")
  );
  expectThat(
    "password reset creates a linked Firebase Auth user",
    await authUserExists("short@example.com")
  );
  expectThat(
    "password reset links the legacy record",
    Boolean(await readPath("users/-Npatient2/authUid"))
  );

  const unknownReset = await client.post("/api/auth/password-reset", {
    email: "ghost@example.com",
  });
  expectThat(
    "password reset does not reveal unknown emails",
    unknownReset.status === 200 &&
      at(unknownReset.json, "message") === at(reset.json, "message")
  );
};
