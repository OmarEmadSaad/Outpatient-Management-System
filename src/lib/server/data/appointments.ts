import "server-only";
import { randomBytes } from "node:crypto";
import type { AppointmentView, Session } from "@/types/domain";
import type {
  AppointmentRecord,
  DoctorRecord,
  QueueReservationRecord,
} from "@/types/firebase";
import {
  BookingError,
  buildAppointment,
  nextQueueReservation,
  type BookingDoctor,
  type BuildAppointmentInput,
  type NewAppointmentRecord,
} from "../../shared/booking";
import {
  getAdminDatabase,
  queryByChildVariants,
  readCollection,
  readValue,
} from "../firebaseAdmin";
import { HttpError } from "../http";
import { enforceRateLimit } from "../rateLimit";
import { publicDoctorId, toAppointmentView } from "./projections";

export interface FoundDoctor extends BookingDoctor {
  key: string;
}

const byNewest = (a: AppointmentView, b: AppointmentView): number =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

export const findDoctorById = async (doctorId: unknown): Promise<FoundDoctor | null> => {
  if (typeof doctorId !== "string" || !doctorId || doctorId.length > 64) {
    return null;
  }
  const [match] = await queryByChildVariants<DoctorRecord>("doctors", "id", doctorId);
  if (match) return { key: match.key, id: doctorId, record: match.record };
  const byKey = /^[A-Za-z0-9_-]+$/.test(doctorId)
    ? await readValue<DoctorRecord>(`doctors/${doctorId}`)
    : null;
  return byKey && publicDoctorId(doctorId, byKey) === doctorId
    ? { key: doctorId, id: doctorId, record: byKey }
    : null;
};

const queueKey = (value: string): string =>
  Buffer.from(value).toString("base64url");

const reserveQueueNumber = async (
  doctorId: string,
  slot: string,
  observedNumber: number
): Promise<number> => {
  const result = await getAdminDatabase()
    .ref(`appointmentQueues/${queueKey(doctorId)}/${queueKey(slot)}`)
    .transaction((current: Partial<QueueReservationRecord> | null) =>
      nextQueueReservation(current, observedNumber, Date.now())
    );
  const reserved = result.snapshot.val() as QueueReservationRecord | null;
  return reserved?.value ?? observedNumber;
};

const DUPLICATE_BOOKING =
  "This booking was just submitted. Please wait a moment before booking the same time slot again.";

const claimBookingSlot = async (
  patientKey: string,
  doctorId: string,
  slot: string
): Promise<void> => {
  try {
    await enforceRateLimit(`booking-slot:${patientKey}:${doctorId}:${slot}`, {
      windowMs: 30 * 1000,
      limit: 1,
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 429) {
      throw new HttpError(409, DUPLICATE_BOOKING);
    }
    throw error;
  }
};

export interface BookingInput {
  doctorId: unknown;
  timeSlot: unknown;
}

export const createAppointmentForPatient = async (
  patient: Session,
  input: BookingInput
): Promise<AppointmentView> => {
  const doctor = await findDoctorById(input.doctorId);
  if (!doctor) throw new HttpError(404, "Doctor not found.");

  const existing = await queryByChildVariants<AppointmentRecord>(
    "appointments",
    "doctorId",
    doctor.id
  );

  const bookingInput: BuildAppointmentInput = {
    patient,
    doctor,
    selectedSlot: input.timeSlot,
    existingAppointments: existing.map(({ record }) => record),
    now: new Date(),
    idSuffix: randomBytes(4).toString("hex"),
  };

  let draft: NewAppointmentRecord;
  try {
    draft = buildAppointment(bookingInput);
  } catch (error) {
    if (error instanceof BookingError) throw new HttpError(400, error.message);
    throw error;
  }

  await claimBookingSlot(patient.key, doctor.id, draft.timeSlot);

  const reservedQueueNumber = await reserveQueueNumber(
    doctor.id,
    draft.timeSlot,
    draft.queueNumber
  );
  const appointment = buildAppointment({ ...bookingInput, reservedQueueNumber });

  const created = await getAdminDatabase()
    .ref(`appointments/${appointment.id}`)
    .transaction((current: unknown) => (current === null ? appointment : undefined));
  if (!created.committed) {
    throw new HttpError(409, "Please try booking again.");
  }
  return toAppointmentView(appointment.id, appointment);
};

export const listPatientAppointments = async (
  patientKey: string
): Promise<AppointmentView[]> =>
  (await queryByChildVariants<AppointmentRecord>("appointments", "user/id", patientKey))
    .map(({ key, record }) => toAppointmentView(key, record))
    .filter((appointment) => appointment.state === "un");

export const listDoctorAppointments = async (
  doctorId: string
): Promise<AppointmentView[]> =>
  (await queryByChildVariants<AppointmentRecord>("appointments", "doctorId", doctorId))
    .map(({ key, record }) => toAppointmentView(key, record))
    .filter((appointment) => appointment.state === "un")
    .sort(byNewest);

export const listAllAppointments = async (): Promise<AppointmentView[]> =>
  (await readCollection<AppointmentRecord>("appointments")).map(({ key, record }) =>
    toAppointmentView(key, record)
  );

export const getAppointment = async (key: unknown): Promise<AppointmentView | null> => {
  if (typeof key !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(key)) {
    return null;
  }
  const record = await readValue<AppointmentRecord>(`appointments/${key}`);
  return record ? toAppointmentView(key, record) : null;
};

export const removeAppointment = (key: string): Promise<void> =>
  getAdminDatabase().ref(`appointments/${key}`).remove();

export const updateAppointmentFields = (
  key: string,
  updates: Partial<AppointmentRecord>
): Promise<void> => getAdminDatabase().ref(`appointments/${key}`).update(updates);
