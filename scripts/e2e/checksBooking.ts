import { readPath } from "./emulatorAdmin.ts";
import { at, valuesOf } from "../json.ts";
import { createClient, expectThat } from "./harness.ts";
import type { Client } from "./harness.ts";

const SLOT = "Sat: 09:00 am - 12:00 pm";

export const checkBookingFlow = async (
  patient: Client,
  doctor: Client
): Promise<string | undefined> => {
  const anonymous = createClient("anonymous");

  const unauthenticated = await anonymous.post("/api/appointments", {
    doctorId: "d1x9",
    timeSlot: SLOT,
  });
  expectThat(
    "anonymous users cannot book",
    unauthenticated.status === 401,
    unauthenticated.status
  );

  const asDoctor = await doctor.post("/api/appointments", {
    doctorId: "d2y8",
    timeSlot: "Mon: 02:00 pm - 05:00 pm",
  });
  expectThat(
    "doctors cannot book as patients",
    asDoctor.status === 403,
    asDoctor.status
  );

  const tampered = await patient.post("/api/appointments", {
    doctorId: "d1x9",
    timeSlot: SLOT,
    ticketPrice: "1",
    queueNumber: 99,
    user: { id: "-Nsomeoneelse", name: "Impersonated" },
    state: "done",
    isPaid: true,
  });
  expectThat(
    "patient can book an appointment",
    tampered.status === 200,
    tampered.text
  );
  const booked = at(tampered.json, "appointment");
  const bookedKey = at(booked, "key");
  const stored = booked ? await readPath(`appointments/${bookedKey}`) : null;
  expectThat(
    "price comes from the doctor record, not the client",
    at(stored, "ticketPrice") === "300",
    at(stored, "ticketPrice")
  );
  expectThat(
    "patient identity comes from the session",
    at(stored, "user", "id") === "-Npatient1" &&
      at(stored, "user", "name") === "Test Patient"
  );
  expectThat(
    "queue number is computed server-side",
    at(stored, "queueNumber") === 2,
    at(stored, "queueNumber")
  );
  expectThat(
    "expected time follows the queue",
    at(stored, "expectedTime") === "9:30 AM",
    at(stored, "expectedTime")
  );
  expectThat(
    "new bookings start unpaid and unconfirmed",
    at(stored, "state") === "un" && at(stored, "isPaid") === false
  );

  const invalidSlot = await patient.post("/api/appointments", {
    doctorId: "d1x9",
    timeSlot: "Sun: 01:00 am - 11:00 pm",
  });
  expectThat(
    "slots outside the doctor's schedule are rejected",
    invalidSlot.status === 400,
    invalidSlot.text
  );

  const invalidDoctor = await patient.post("/api/appointments", {
    doctorId: "../users",
    timeSlot: SLOT,
  });
  expectThat(
    "unknown or malicious doctor ids are rejected",
    invalidDoctor.status === 404,
    invalidDoctor.status
  );

  return typeof bookedKey === "string" ? bookedKey : undefined;
};

export const checkReviewFlow = async (
  patient: Client,
  doctor: Client
): Promise<void> => {
  const anonymous = await createClient("anonymous").post("/api/reviews", {
    doctorId: "d1x9",
    rating: 8,
    reviewText: "Hi",
  });
  expectThat("anonymous users cannot review", anonymous.status === 401);

  const asDoctor = await doctor.post("/api/reviews", {
    doctorId: "d2y8",
    rating: 8,
    reviewText: "Hi",
  });
  expectThat("doctors cannot post patient reviews", asDoctor.status === 403);

  const invalid = await patient.post("/api/reviews", {
    doctorId: "d1x9",
    rating: 50,
    reviewText: "Hi",
  });
  expectThat("out of range ratings are rejected", invalid.status === 400);

  const review = await patient.post("/api/reviews", {
    doctorId: "d1x9",
    rating: 6,
    reviewText: "Kind doctor",
    userId: "-Nsomeoneelse",
  });
  expectThat("patient can post a review", review.status === 200, review.text);
  const reviews = valuesOf(await readPath("reviews"));
  const created = reviews.find(
    (item) => at(item, "reviewText") === "Kind doctor"
  );
  expectThat(
    "review author comes from the session",
    at(created, "userId") === "-Npatient1",
    at(created, "userId")
  );

  const page = await createClient("anonymous").get("/doctors/d1x9");
  expectThat(
    "new review appears on the doctor page after revalidation",
    page.text.includes("Kind doctor")
  );
};

export const checkPatientDashboard = async (
  patient: Client,
  doctor: Client,
  bookedKey: string | undefined
): Promise<void> => {
  const anonymous = createClient("anonymous");
  const redirected = await anonymous.get("/user/profile/me");
  expectThat(
    "patient dashboard redirects anonymous users to login",
    [303, 307].includes(redirected.status) &&
      (redirected.headers.get("location") || "").includes("/login"),
    redirected.status
  );

  const doctorRedirect = await doctor.get("/user/profile/me");
  expectThat(
    "doctors cannot open the patient dashboard",
    [303, 307].includes(doctorRedirect.status),
    doctorRedirect.status
  );

  for (const path of ["/user/profile/me", "/users/profile/me"]) {
    const page = await patient.get(path);
    expectThat(
      `${path} renders for the patient`,
      page.status === 200,
      page.status
    );
  }
  const page = await patient.get("/user/profile/me");
  expectThat(
    "patient dashboard lists own active bookings",
    page.text.includes("Dr Sara") && page.text.includes("Dr Omar")
  );
  expectThat(
    "patient dashboard is noindex",
    page.text.includes('content="noindex, nofollow"')
  );
  expectThat(
    "patient dashboard exposes no password",
    !page.text.includes("Patient123")
  );
  expectThat(
    "new booking visible in dashboard",
    !!bookedKey && page.text.includes(bookedKey)
  );
};

export const checkDoctorDashboard = async (
  doctor: Client,
  patient: Client,
  bookedKey: string | undefined
): Promise<void> => {
  const page = await doctor.get("/doctors/profile/me");
  expectThat(
    "doctor dashboard renders after a fresh request",
    page.status === 200,
    page.status
  );
  expectThat(
    "doctor sees own patients' appointments",
    page.text.includes("Test Patient") &&
      page.text.includes(String(bookedKey))
  );
  expectThat(
    "doctor does not see other doctors' appointments",
    !page.text.includes("app2000other")
  );

  const foreign = await doctor.del("/api/doctor/appointments/app2000other");
  expectThat(
    "doctor cannot remove another doctor's appointment",
    foreign.status === 404
  );
  expectThat(
    "foreign appointment still exists",
    Boolean(await readPath("appointments/app2000other"))
  );

  const asPatient = await patient.del(`/api/doctor/appointments/${bookedKey}`);
  expectThat(
    "patients cannot use doctor appointment actions",
    asPatient.status === 403
  );

  const complete = await doctor.del(`/api/doctor/appointments/${bookedKey}`);
  expectThat("doctor can complete own appointment", complete.status === 200);

  const update = await doctor.patch("/api/doctor/profile", {
    name: "Dr Sara",
    gender: "female",
    specialization: "Dermatology",
    phone: "01000000000",
    ticketPrice: 350,
    bio: "Updated bio",
    timeSlots: [{ day: "Sat", startingTime: "09:00", endingTime: "12:00" }],
    qualifications: [],
    experiences: [],
    role: "admin",
    id: "hijack",
    email: "evil@example.com",
  });
  expectThat(
    "doctor can update own profile",
    update.status === 200,
    update.text
  );
  const record = await readPath("doctors/-Ndoctor1");
  expectThat(
    "doctor profile update merges instead of replacing",
    at(record, "id") === "d1x9" &&
      at(record, "role") === "doctor" &&
      at(record, "email") === "doctor@example.com"
  );
  expectThat(
    "doctor profile update applied allowed fields",
    at(record, "bio") === "Updated bio" &&
      at(record, "ticketPrice") === 350
  );

  const publicPage = await createClient("anonymous").get("/doctors/d1x9");
  expectThat(
    "doctor profile change is visible publicly after revalidation",
    publicPage.text.includes("Updated bio")
  );
};
