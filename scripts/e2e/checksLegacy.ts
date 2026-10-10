import { at, keysOf, sameJson, valuesOf } from "../json.ts";
import { auth, readPath } from "./emulatorAdmin.ts";
import { createClient, expectThat, login } from "./harness.ts";
import type { Client } from "./harness.ts";
import {
  LEGACY_FIXTURE_PASSWORDS as PW,
  legacyDoctors,
} from "./legacySeed.ts";

const toList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : valuesOf(value);

export const checkLegacyPublicData = async (): Promise<void> => {
  const client = createClient("anonymous");
  const doctor = await client.get("/doctors/7");
  expectThat(
    "doctor with numeric legacy id renders",
    doctor.status === 200 && doctor.text.includes("Dr.Legacy Numeric"),
    doctor.status
  );
  expectThat(
    "object-shaped legacy qualifications render",
    doctor.text.includes("Legacy University")
  );
  expectThat(
    "review with numeric doctorId is shown",
    doctor.text.includes("Great with kids")
  );
  expectThat(
    "legacy doctor page hides email and phone",
    !/Numeric\.Doctor@|\+20 100/i.test(doctor.text)
  );
  const service = await client.get("/services-details?service=Pediatrics");
  expectThat(
    "legacy service lists its doctor",
    service.text.includes("Dr.Legacy Numeric")
  );
};

export const checkLegacyLogins = async (): Promise<{
  patient: Client;
  doctor: Client;
}> => {
  const racers = await Promise.all(
    [1, 2, 3].map(() =>
      login(
        createClient("race"),
        "legacy.user@example.com",
        PW.mixedCasePatient,
        "patient"
      )
    )
  );
  expectThat(
    "concurrent first logins all succeed",
    racers.every((r) => r.status === 200),
    racers.map((r) => r.status).join(",")
  );
  const links = valuesOf(await readPath("authLinks")).filter(
    (l) => at(l, "collection") === "users" && at(l, "key") === "1"
  );
  expectThat(
    "concurrent migration creates exactly one auth link",
    links.length === 1,
    links.length
  );
  const { users } = await auth.listUsers(1000);
  expectThat(
    "concurrent migration creates exactly one auth user",
    users.filter((u) => u.email === "legacy.user@example.com").length === 1
  );
  const mixed = await readPath("users/1");
  expectThat(
    "mixed-case stored email is left unchanged",
    at(mixed, "email") === "Legacy.User@Example.com"
  );
  expectThat(
    "mixed-case account migrated safely",
    at(mixed, "password") == null && Boolean(at(mixed, "authUid"))
  );

  const spaced = await login(
    createClient("spaced"),
    "spaced@example.com",
    PW.spacedPatient,
    "patient"
  );
  expectThat(
    "legacy password with stray whitespace still works",
    spaced.status === 200,
    spaced.text
  );

  const patient = createClient("array-patient");
  const arrayLogin = await login(
    patient,
    "arraypatient@example.com",
    PW.arrayPatient,
    "patient"
  );
  expectThat(
    "patient stored under array-style key logs in",
    arrayLogin.status === 200 &&
      at(arrayLogin.json, "user", "userId") === "0",
    arrayLogin.text
  );

  const doctor = createClient("numeric-doctor");
  const doctorLogin = await login(
    doctor,
    "numeric.doctor@example.com",
    PW.numericDoctor,
    "doctor"
  );
  expectThat(
    "doctor with numeric id and mixed-case email logs in",
    doctorLogin.status === 200,
    doctorLogin.text
  );
  return { patient, doctor };
};

export const checkLegacyPatientFlows = async (
  patient: Client
): Promise<void> => {
  const dashboard = await patient.get("/user/profile/me");
  expectThat(
    "legacy appointment with numeric doctorId appears for the patient",
    dashboard.text.includes("Dr.Legacy Numeric")
  );

  const before = await readPath("users/0");
  const update = await patient.patch("/api/profile", {
    name: at(before, "name"),
    photo: at(before, "photo"),
    gender: at(before, "gender"),
    bloodType: at(before, "bloodType"),
    phoneNumber: "01000000001",
  });
  expectThat(
    "profile saves with an unchanged photo from an old host",
    update.status === 200,
    update.text
  );
  const after = await readPath("users/0");
  expectThat(
    "profile save keeps unrelated and unknown fields",
    at(after, "photo") === at(before, "photo") &&
      at(after, "legacyNote") === at(before, "legacyNote") &&
      at(after, "id") === "a123" &&
      at(after, "phoneNumber") === "01000000001"
  );

  const next = await patient.post("/api/appointments", {
    doctorId: "7",
    timeSlot: "Tue: 10:00 am - 01:00 pm",
  });
  expectThat(
    "queue counts existing legacy appointments with numeric doctorId",
    at(next.json, "appointment", "queueNumber") === 2,
    next.text
  );
  const stored = await readPath(
    `appointments/${at(next.json, "appointment", "key")}`
  );
  expectThat(
    "legacy string ticket price is used",
    at(stored, "ticketPrice") === "250"
  );
};

export const checkLegacyDoctorProfileSave = async (
  doctor: Client
): Promise<void> => {
  const page = await doctor.get("/doctors/profile/me");
  expectThat(
    "numeric-id doctor sees own legacy appointment",
    page.status === 200 && page.text.includes("Array Patient")
  );

  const before = await readPath("doctors/-Nnumeric");
  const save = await doctor.patch("/api/doctor/profile", {
    name: at(before, "name"),
    email: at(before, "email"),
    gender: at(before, "gender"),
    specialization: at(before, "specialization"),
    phone: at(before, "phone"),
    ticketPrice: at(before, "ticketPrice"),
    bio: "Updated legacy bio",
    about: at(before, "about"),
    photo: at(before, "photo"),
    qualifications: toList(at(before, "qualifications")),
    experiences: toList(at(before, "experiences")),
    timeSlots: toList(at(before, "timeSlots")),
  });
  expectThat(
    "legacy doctor profile saves as the UI sends it",
    save.status === 200,
    save.text
  );
  const after = await readPath("doctors/-Nnumeric");
  const unchanged = keysOf(before).filter(
    (field) => !["bio", "password"].includes(field)
  );
  const drifted = unchanged.filter(
    (field) => !sameJson(at(before, field), at(after, field))
  );
  expectThat(
    "doctor save changes only the edited field",
    drifted.length === 0 && at(after, "bio") === "Updated legacy bio",
    drifted.join(",")
  );
  expectThat(
    "object-shaped qualifications keep their shape and extra fields",
    sameJson(
      at(after, "qualifications"),
      legacyDoctors["-Nnumeric"].qualifications
    )
  );
  expectThat(
    "string ticket price keeps its type",
    at(after, "ticketPrice") === "250"
  );
};
