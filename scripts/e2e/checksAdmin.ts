import { auth, readPath } from "./emulatorAdmin.ts";
import { at, entriesOf } from "../json.ts";
import { createClient, expectThat, login } from "./harness.ts";
import type { Client } from "./harness.ts";

const CLOUDINARY_IMAGE =
  "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const ADMIN_PAGES = [
  "/admin/profile/me",
  "/patients",
  "/appointments",
  "/doctors-edite",
  "/all-services",
  "/services/add",
  "/services/srv1",
];

const findByField = (
  collection: unknown,
  field: string,
  value: string
): [string, unknown] | undefined =>
  entriesOf(collection).find(([, record]) => at(record, field) === value);

export const checkAdminAuthorization = async (
  patient: Client,
  doctor: Client
): Promise<void> => {
  for (const client of [createClient("anonymous"), patient, doctor]) {
    for (const path of ADMIN_PAGES) {
      const response = await client.get(path);
      expectThat(
        `${client.label} is redirected away from ${path}`,
        [303, 307].includes(response.status),
        response.status
      );
    }
    const api = await client.patch("/api/admin/users/-Npatient1", {
      role: "admin",
    });
    expectThat(
      `${client.label} cannot call admin APIs`,
      [401, 403].includes(api.status),
      api.status
    );
  }
  expectThat(
    "role was not escalated by non-admins",
    (await readPath("users/-Npatient1/role")) === "patient"
  );

  const register = await patient.post("/api/auth/register", {
    name: "Evil Doctor",
    email: "evil@example.com",
    password: "Evil12345",
    gender: "male",
    role: "admin",
  });
  expectThat(
    "patients cannot create admin accounts",
    register.status === 403,
    register.status
  );
  const anonymousDoctor = await createClient("anonymous").post(
    "/api/auth/register",
    {
      name: "Fake Doctor",
      email: "fake@example.com",
      password: "Fake12345",
      gender: "male",
      role: "doctor",
    }
  );
  expectThat(
    "anonymous visitors cannot create doctor accounts",
    anonymousDoctor.status === 403,
    anonymousDoctor.status
  );
};

export const checkAdminFeatures = async (admin: Client): Promise<void> => {
  for (const path of ADMIN_PAGES) {
    const response = await admin.get(path);
    expectThat(
      `admin can open ${path}`,
      response.status === 200,
      response.status
    );
  }
  const stats = await admin.get("/admin/profile/me");
  expectThat(
    "admin stats render counts",
    stats.text.includes("Total Patients") &&
      stats.text.includes("Total Doctors")
  );
  const patientsPage = await admin.get("/patients");
  expectThat(
    "admin patients page shows no passwords",
    !patientsPage.text.includes("Promoted123") &&
      !patientsPage.text.includes('abc"')
  );

  const promote = await admin.patch("/api/admin/users/-Npatient2", {
    role: "admin",
  });
  expectThat(
    "admin can promote a patient",
    promote.status === 200 &&
      (await readPath("users/-Npatient2/role")) === "admin"
  );
  const demote = await admin.patch("/api/admin/users/-Npatient2", {
    role: "patient",
  });
  expectThat(
    "admin can demote an admin",
    demote.status === 200 &&
      (await readPath("users/-Npatient2/role")) === "patient"
  );
  const badRole = await admin.patch("/api/admin/users/-Npatient2", {
    role: "superuser",
  });
  expectThat("invalid roles are rejected", badRole.status === 400);
  const traversal = await admin.patch("/api/admin/users/..%2Fadmin", {
    role: "admin",
  });
  expectThat(
    "path traversal in keys is rejected",
    [400, 404].includes(traversal.status),
    traversal.status
  );

  const created = await admin.post("/api/admin/services", {
    name: "Cardiology",
    desc: "Heart care",
    image: CLOUDINARY_IMAGE,
  });
  expectThat(
    "admin can create a service",
    created.status === 200,
    created.text
  );
  const untrusted = await admin.post("/api/admin/services", {
    name: "Bad",
    desc: "Bad",
    image: "https://evil.example/x.png",
  });
  expectThat("services reject untrusted image URLs", untrusted.status === 400);
  const [serviceKey] =
    findByField(await readPath("services"), "name", "Cardiology") || [];
  const edited = await admin.patch(`/api/admin/services/${serviceKey}`, {
    name: "Cardiology",
    desc: "Heart and vessels",
  });
  expectThat(
    "admin can edit a service",
    edited.status === 200 &&
      (await readPath(`services/${serviceKey}/desc`)) === "Heart and vessels"
  );
  const servicesPage = await createClient("anonymous").get("/services");
  expectThat(
    "service changes appear publicly after revalidation",
    servicesPage.text.includes("Heart and vessels")
  );
  const removed = await admin.del(`/api/admin/services/${serviceKey}`);
  expectThat(
    "admin can delete a service",
    removed.status === 200 && !(await readPath(`services/${serviceKey}`))
  );

  const appointment = await admin.patch(
    "/api/admin/appointments/app2000other",
    { timeSlot: "Mon: 02:00 pm - 05:00 pm", ticketPrice: "250", state: "done" }
  );
  expectThat(
    "admin can edit appointments",
    appointment.status === 200 &&
      (await readPath("appointments/app2000other/state")) === "done"
  );
  const badState = await admin.patch("/api/admin/appointments/app2000other", {
    timeSlot: "x",
    ticketPrice: "1",
    state: "hacked",
  });
  expectThat(
    "invalid appointment states are rejected",
    badState.status === 400
  );

  const newDoctor = await admin.post("/api/auth/register", {
    name: "Dr New",
    email: "newdoctor@example.com",
    password: "NewDoctor123",
    gender: "male",
    role: "doctor",
    specialization: "Neurology",
    phone: "01200000000",
    ticketPrice: 150,
  });
  expectThat(
    "admin can register a doctor",
    newDoctor.status === 200,
    newDoctor.text
  );
  const [newDoctorKey, newDoctorRecord] =
    findByField(await readPath("doctors"), "email", "newdoctor@example.com") ||
    [];
  expectThat(
    "new doctor record stores no password",
    Boolean(newDoctorRecord) && at(newDoctorRecord, "password") === undefined
  );
  const doctorLogin = await login(
    createClient("new-doctor"),
    "newdoctor@example.com",
    "NewDoctor123",
    "doctor"
  );
  expectThat(
    "newly registered doctor can log in",
    doctorLogin.status === 200,
    doctorLogin.text
  );

  const deleted = await admin.del(`/api/admin/doctors/${newDoctorKey}`);
  expectThat(
    "admin can delete a doctor",
    deleted.status === 200 && !(await readPath(`doctors/${newDoctorKey}`))
  );
  const deletedAuth = await auth.getUserByEmail("newdoctor@example.com").then(
    () => true,
    () => false
  );
  expectThat("deleted doctor loses Firebase Auth access", !deletedAuth);
};

export const checkPublicRegistration = async (): Promise<void> => {
  const client = createClient("visitor");
  const weak = await client.post("/api/auth/register", {
    name: "New Patient",
    email: "new@example.com",
    password: "weak",
    gender: "male",
    role: "patient",
  });
  expectThat(
    "registration enforces password rules server-side",
    weak.status === 400
  );
  const created = await client.post("/api/auth/register", {
    name: "New Patient",
    email: "new@example.com",
    password: "NewPatient123",
    gender: "male",
    role: "patient",
  });
  expectThat(
    "visitors can register as patients",
    created.status === 200,
    created.text
  );
  const duplicate = await client.post("/api/auth/register", {
    name: "Other",
    email: "NEW@example.com",
    password: "NewPatient123",
    gender: "male",
    role: "patient",
  });
  expectThat(
    "duplicate emails are rejected case-insensitively",
    duplicate.status === 409,
    duplicate.status
  );
  const record = findByField(
    await readPath("users"),
    "email",
    "new@example.com"
  )?.[1];
  expectThat(
    "registered patient record stores no password",
    Boolean(record) &&
      at(record, "password") === undefined &&
      at(record, "role") === "patient"
  );
};
