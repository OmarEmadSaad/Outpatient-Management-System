import { describe, expect, it } from "vitest";
import {
  appointmentBelongsToDoctor,
  appointmentBelongsToPatient,
  BookingError,
  buildAppointment,
} from "@/lib/shared/booking";

const doctor = {
  id: "d1x9",
  record: {
    name: "Dr Sara",
    photo: "https://res.cloudinary.com/demo/doctor.png",
    phone: "01000000000",
    ticketPrice: 300,
    timeSlots: [{ day: "Sat", startingTime: "09:00", endingTime: "12:00" }],
  },
};

const patient = {
  key: "-Npatient1",
  record: {
    name: "Test Patient",
    email: "patient@example.com",
    gender: "male",
  },
};

const build = (overrides = {}) =>
  buildAppointment({
    patient,
    doctor,
    selectedSlot: "Sat: 09:00 am - 12:00 pm",
    existingAppointments: [],
    now: new Date("2026-01-01T10:00:00.000Z"),
    idSuffix: "abcd1234",
    ...overrides,
  });

describe("buildAppointment", () => {
  it("derives price, identities and queue data on the server", () => {
    const appointment = build();
    expect(appointment).toMatchObject({
      id: "app1767261600000abcd1234",
      doctorId: "d1x9",
      ticketPrice: "300",
      state: "un",
      isPaid: false,
      queueNumber: 1,
      expectedTime: "9:15 AM",
      timeSlot: "Sat: 09:00 am - 12:00 pm",
      user: { id: "-Npatient1", name: "Test Patient" },
      doctor: { id: "d1x9", name: "Dr Sara", phone: "01000000000" },
    });
  });

  it("increments the queue for the same doctor and slot only", () => {
    const existing = [
      { doctorId: "d1x9", timeSlot: "Sat: 09:00 am - 12:00 pm" },
      { doctorId: "d1x9", timeSlot: "Sat: 09:00 am - 12:00 pm" },
      { doctorId: "other", timeSlot: "Sat: 09:00 am - 12:00 pm" },
      { doctorId: "d1x9", timeSlot: "Mon: 02:00 pm - 05:00 pm" },
    ];
    const appointment = build({ existingAppointments: existing });
    expect(appointment.queueNumber).toBe(3);
    expect(appointment.expectedTime).toBe("9:45 AM");
  });

  it("rejects slots that are not in the doctor's schedule", () => {
    expect(() => build({ selectedSlot: "Sun: 09:00 am - 12:00 pm" })).toThrow(
      BookingError
    );
    expect(() => build({ selectedSlot: "" })).toThrow(
      "Please select a time slot."
    );
  });

  it("never copies client supplied fields into the appointment", () => {
    const appointment = build();
    expect(appointment).not.toHaveProperty("password");
    expect(Object.keys(appointment.user ?? {}).sort()).toEqual(
      ["email", "gender", "id", "name", "photo"].sort()
    );
  });
});

describe("appointment ownership", () => {
  const appointment = {
    user: { id: "-Npatient1" },
    doctorId: "d1x9",
    doctor: { id: "d1x9" },
  };

  it("matches the owning patient only", () => {
    expect(appointmentBelongsToPatient(appointment, "-Npatient1")).toBe(true);
    expect(appointmentBelongsToPatient(appointment, "-Nother")).toBe(false);
    expect(appointmentBelongsToPatient(appointment, "")).toBe(false);
  });

  it("matches the owning doctor only", () => {
    expect(appointmentBelongsToDoctor(appointment, "d1x9")).toBe(true);
    expect(appointmentBelongsToDoctor(appointment, "d2y8")).toBe(false);
    expect(appointmentBelongsToDoctor(appointment, null)).toBe(false);
  });
});
