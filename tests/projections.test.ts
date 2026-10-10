import { describe, expect, it } from "vitest";
import {
  toAdminUserView,
  toAppointmentView,
  toProfileView,
  toPublicDoctor,
} from "@/lib/server/data/projections";
import type { Account } from "@/types/domain";
import type { UserRecord } from "@/types/firebase";

const SENSITIVE_FIELDS = ["password", "email", "phone", "authUid"];

describe("public projections", () => {
  const doctorRecord = {
    id: "d1x9",
    name: "Dr Sara",
    email: "doctor@example.com",
    password: "Doctor123",
    phone: "01000000000",
    authUid: "uid-1",
    specialization: "Dermatology",
    timeSlots: {
      a: { day: "Sat", startingTime: "09:00", endingTime: "12:00" },
    },
  };

  it("never exposes credentials or contact details of doctors", () => {
    const doctor = toPublicDoctor("-Ndoctor1", doctorRecord);
    SENSITIVE_FIELDS.forEach((field) =>
      expect(doctor).not.toHaveProperty(field)
    );
    expect(JSON.stringify(doctor)).not.toContain("Doctor123");
    expect(doctor.id).toBe("d1x9");
    expect(doctor.timeSlots).toHaveLength(1);
  });

  it("falls back to the database key when a doctor has no id", () => {
    expect(toPublicDoctor("-Nkey", { name: "x" }).id).toBe("-Nkey");
  });

  it("never exposes passwords in profile, admin and appointment views", () => {
    const account: Account<UserRecord> = {
      uid: null,
      collection: "users",
      key: "-Npatient1",
      role: "patient",
      record: { name: "P", password: "secret" },
    };
    expect(JSON.stringify(toProfileView(account))).not.toContain("secret");
    expect(
      JSON.stringify(toAdminUserView("-Npatient1", { password: "secret" }))
    ).not.toContain("secret");
    const appointment = toAppointmentView("app1", {
      user: { id: "u", password: "secret" },
    });
    expect(JSON.stringify(appointment)).not.toContain("secret");
  });
});
