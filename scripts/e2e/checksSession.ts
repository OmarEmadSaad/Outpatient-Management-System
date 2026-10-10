import { readPath } from "./emulatorAdmin.ts";
import { at } from "../json.ts";
import { createClient, expectThat, login } from "./harness.ts";
import type { Client } from "./harness.ts";
import { LEGACY_PASSWORDS } from "./seed.ts";

const NEW_PATIENT_PASSWORD = "NewPatient456";

export const checkPasswordChangeAndLogout = async (
  patient: Client
): Promise<string> => {
  const update = await patient.patch("/api/profile", {
    name: "Test Patient",
    password: NEW_PATIENT_PASSWORD,
    bloodType: "B+",
  });
  expectThat(
    "patient can change password through Firebase Auth",
    update.status === 200 && at(update.json, "changed") === true,
    update.text
  );
  expectThat(
    "profile update never stores a password in the database",
    (await readPath("users/-Npatient1/password")) == null
  );
  expectThat(
    "profile update merges fields",
    (await readPath("users/-Npatient1/bloodType")) === "B+" &&
      (await readPath("users/-Npatient1/id")) === "u1a2"
  );

  const weak = await patient.patch("/api/profile", {
    name: "Test Patient",
    password: "weak",
  });
  expectThat("weak new passwords are rejected", weak.status === 400);

  const oldPassword = await login(
    createClient("old"),
    "patient@example.com",
    LEGACY_PASSWORDS.patient,
    "patient"
  );
  expectThat(
    "old password stops working after change",
    oldPassword.status === 401,
    oldPassword.status
  );
  const fresh = createClient("fresh");
  const newPassword = await login(
    fresh,
    "patient@example.com",
    NEW_PATIENT_PASSWORD,
    "patient"
  );
  expectThat(
    "new password works",
    newPassword.status === 200,
    newPassword.text
  );

  const stolenCookie = fresh.cookie;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const logout = await fresh.post("/api/auth/logout");
  expectThat(
    "logout succeeds and clears the cookie",
    logout.status === 200 && !fresh.cookie
  );
  const replay = createClient("replay");
  replay.setCookie(stolenCookie);
  const me = await replay.get("/api/auth/me");
  expectThat(
    "logged-out session cookie is revoked",
    at(me.json, "user") === null,
    me.text
  );

  const csrf = await createClient("attacker").post(
    "/api/auth/login",
    {
      email: "patient@example.com",
      password: NEW_PATIENT_PASSWORD,
      role: "patient",
    },
    { origin: "https://evil.example" }
  );
  expectThat(
    "cross-site POST requests are rejected",
    csrf.status === 403,
    csrf.status
  );

  return NEW_PATIENT_PASSWORD;
};
