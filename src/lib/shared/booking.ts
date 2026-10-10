import type {
  AccountRecord,
  AppointmentRecord,
  DoctorRecord,
  LegacyId,
  QueueReservationRecord,
} from "@/types/firebase";
import {
  calculateExpectedTime,
  extractStartTime,
  findMatchingSlotLabel,
} from "./timeSlots";

export const DEFAULT_AVATAR_URL =
  "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";

export class BookingError extends Error {}

export const QUEUE_RESERVATION_WINDOW_MS = 60 * 1000;

interface QueueEntry {
  doctorId?: LegacyId;
  timeSlot?: string;
  queueNumber?: unknown;
}

const MAX_QUEUE_NUMBER = 100000;

export const nextQueueNumber = (
  appointments: QueueEntry[],
  doctorId: LegacyId,
  slot: string
): number => {
  const matching = appointments.filter(
    (appointment) =>
      String(appointment.doctorId) === String(doctorId) &&
      appointment.timeSlot === slot
  );
  const highest = matching.reduce((max, appointment) => {
    const value = Number(appointment.queueNumber);
    return Number.isSafeInteger(value) &&
      value > max &&
      value <= MAX_QUEUE_NUMBER
      ? value
      : max;
  }, 0);
  return Math.max(matching.length, highest) + 1;
};

export const nextQueueReservation = (
  current: Partial<QueueReservationRecord> | null | undefined,
  observedNumber: number,
  now: number
): QueueReservationRecord => {
  const previousValue = Number(current?.value);
  const isRecent =
    Number.isFinite(previousValue) &&
    now - Number(current?.at) < QUEUE_RESERVATION_WINDOW_MS;
  const value = Math.max(observedNumber, isRecent ? previousValue + 1 : 0);
  return { value, at: now };
};

export interface BookingPatient {
  key: string;
  record: AccountRecord;
}

export interface BookingDoctor {
  id: string;
  record: DoctorRecord;
}

export interface BuildAppointmentInput {
  patient: BookingPatient;
  doctor: BookingDoctor;
  selectedSlot: unknown;
  existingAppointments: QueueEntry[];
  now: Date;
  idSuffix: string;
  reservedQueueNumber?: number;
}

export interface NewAppointmentRecord extends AppointmentRecord {
  id: string;
  doctorId: string;
  ticketPrice: string;
  createdAt: string;
  state: "un";
  timeSlot: string;
  isPaid: false;
  queueNumber: number;
  expectedTime: string;
}

export const buildAppointment = ({
  patient,
  doctor,
  selectedSlot,
  existingAppointments,
  now,
  idSuffix,
  reservedQueueNumber,
}: BuildAppointmentInput): NewAppointmentRecord => {
  if (!selectedSlot) throw new BookingError("Please select a time slot.");

  const slot = findMatchingSlotLabel(selectedSlot, doctor.record.timeSlots);
  if (!slot) {
    throw new BookingError(
      "The selected time slot is not available for this doctor."
    );
  }

  const startTime = extractStartTime(slot);
  if (!startTime) throw new BookingError("Invalid time slot format");

  const queueNumber =
    reservedQueueNumber ??
    nextQueueNumber(existingAppointments, doctor.id, slot);

  return {
    id: `app${now.getTime()}${idSuffix}`,
    user: {
      id: patient.key,
      name: patient.record.name || "Anonymous User",
      email: patient.record.email || "no-email@example.com",
      photo: patient.record.photo || DEFAULT_AVATAR_URL,
      gender: patient.record.gender || "Unknown",
    },
    doctorId: doctor.id,
    ticketPrice: String(doctor.record.ticketPrice ?? 0),
    createdAt: now.toISOString(),
    state: "un",
    timeSlot: slot,
    isPaid: false,
    queueNumber,
    expectedTime: calculateExpectedTime(startTime, queueNumber),
    doctor: {
      id: doctor.id,
      name: doctor.record.name || "Unknown Doctor",
      photo: doctor.record.photo || DEFAULT_AVATAR_URL,
      phone: doctor.record.phone || "Not available",
    },
  };
};

interface OwnedAppointment {
  doctorId?: LegacyId;
  user?: { id?: LegacyId };
  doctor?: { id?: LegacyId };
}

export const appointmentBelongsToPatient = (
  appointment: OwnedAppointment | null | undefined,
  patientKey: string | null | undefined
): boolean =>
  Boolean(patientKey) && String(appointment?.user?.id) === patientKey;

export const appointmentBelongsToDoctor = (
  appointment: OwnedAppointment | null | undefined,
  doctorId: LegacyId | null | undefined
): boolean =>
  Boolean(doctorId) &&
  (String(appointment?.doctorId) === String(doctorId) ||
    String(appointment?.doctor?.id) === String(doctorId));
