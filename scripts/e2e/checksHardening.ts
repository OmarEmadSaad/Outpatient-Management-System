import { at, valuesOf } from "../json.ts";
import { auth, readPath } from "./emulatorAdmin.ts";
import { BASE_URL } from "./env.ts";
import { createClient, expectThat, login } from "./harness.ts";
import type { Client } from "./harness.ts";
import { LEGACY_FIXTURE_PASSWORDS as PW } from "./legacySeed.ts";

const RESET_EMAIL = "reset.target@example.com";
const NEW_PASSWORD = "Chosen1234";
const SLOT = "Wed: 09:30 am - 12:00 pm";

export const checkLegacyPasswordCannotOverrideNewLogin =
  async (): Promise<void> => {
    const reset = await createClient("reset").post("/api/auth/password-reset", {
      email: RESET_EMAIL,
    });
    expectThat("password reset is accepted", reset.status === 200, reset.text);
    const authUser = await auth.getUserByEmail(RESET_EMAIL);
    await auth.updateUser(authUser.uid, { password: NEW_PASSWORD });

    const oldPassword = await login(
      createClient("attacker"),
      RESET_EMAIL,
      PW.resetPatient,
      "patient"
    );
    expectThat(
      "old legacy password cannot take over an account with a newer password",
      oldPassword.status === 401,
      oldPassword.status
    );
    const owner = await login(
      createClient("owner"),
      RESET_EMAIL,
      NEW_PASSWORD,
      "patient"
    );
    expectThat(
      "account owner still signs in with the new password",
      owner.status === 200,
      owner.text
    );
    expectThat(
      "legacy password is removed once the owner signs in",
      (await readPath("users/-Nreset/password")) === null
    );
  };

const registerPatient = async (index: number): Promise<Client> => {
  const email = `racer${index}@example.com`;
  const password = `Racer${index}2345`;
  await createClient("register").post("/api/auth/register", {
    name: `Racer ${index}`,
    email,
    password,
    gender: "male",
    role: "patient",
  });
  const client = createClient(`racer-${index}`);
  await login(client, email, password, "patient");
  return client;
};

export const checkBookingRaces = async (patient: Client): Promise<void> => {
  const duplicates = await Promise.all(
    Array.from({ length: 5 }, () =>
      patient.post("/api/appointments", { doctorId: "7", timeSlot: SLOT })
    )
  );
  const statuses = duplicates.map((response) => response.status);
  expectThat(
    "repeated submissions by one patient create exactly one booking",
    statuses.filter((status) => status === 200).length === 1 &&
      statuses.filter((status) => status === 409).length === 4,
    statuses.join(",")
  );

  const racers = await Promise.all([1, 2, 3, 4].map(registerPatient));
  const bookings = await Promise.all(
    racers.map((racer) =>
      racer.post("/api/appointments", { doctorId: "7", timeSlot: SLOT })
    )
  );
  const numbers = bookings.map((response) =>
    at(response.json, "appointment", "queueNumber")
  );
  expectThat(
    "different patients booking at once all succeed",
    bookings.every((response) => response.status === 200),
    bookings.map((response) => response.status).join(",")
  );
  expectThat(
    "concurrent bookings get distinct queue numbers",
    new Set(numbers).size === racers.length,
    numbers.join(",")
  );

  const stored = valuesOf(await readPath("appointments")).filter(
    (appointment) =>
      String(at(appointment, "doctorId")) === "7" &&
      at(appointment, "timeSlot") === SLOT
  );
  const storedNumbers = stored.map((appointment) =>
    at(appointment, "queueNumber")
  );
  expectThat(
    "no two stored bookings share a queue number",
    new Set(storedNumbers).size === stored.length,
    storedNumbers.join(",")
  );
};

const rawLogin = (headers: Record<string, string>, body: string) =>
  fetch(`${BASE_URL}/api/auth/login`, { method: "POST", headers, body });

export const checkRequestHardening = async (): Promise<void> => {
  const payload = JSON.stringify({
    email: "patient@example.com",
    password: "wrong-password",
    role: "patient",
  });
  const crossSite = await rawLogin(
    { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
    payload
  );
  expectThat(
    "cross-site requests without an Origin header are rejected",
    crossSite.status === 403,
    crossSite.status
  );
  const formPost = await rawLogin(
    {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: BASE_URL,
    },
    "email=patient%40example.com&password=x&role=patient"
  );
  expectThat(
    "form-encoded bodies are rejected",
    formPost.status === 415,
    formPost.status
  );
  const oversized = await rawLogin(
    { "Content-Type": "application/json", Origin: BASE_URL },
    JSON.stringify({ email: "x".repeat(70 * 1024) })
  );
  expectThat(
    "oversized request bodies are rejected",
    oversized.status === 413,
    oversized.status
  );
  const leak = await oversized.text();
  expectThat(
    "error responses do not include stack traces",
    !/at \w+ \(|node_modules|firebase/i.test(leak),
    leak
  );
};
