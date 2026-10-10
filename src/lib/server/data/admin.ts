import "server-only";
import type {
  AdminDoctorRow,
  AdminStats,
  AdminUserView,
  AppointmentView,
  PublicService,
  Session,
} from "@/types/domain";
import type {
  AppointmentRecord,
  DoctorRecord,
  ServiceRecord,
  UserRecord,
} from "@/types/firebase";
import { deleteAccountCompletely, toAccount } from "../accounts";
import {
  getAdminDatabase,
  queryByChildVariants,
  readCollection,
  readValue,
} from "../firebaseAdmin";
import { HttpError, type JsonBody } from "../http";
import {
  cleanText,
  isAppointmentState,
  isTrustedImageUrl,
  isValidFirebaseKey,
  parseTicketPrice,
} from "../../shared/validation";
import { listAllAppointments } from "./appointments";
import {
  normalizeId,
  text,
  toAdminUserView,
  toPublicDoctor,
  toPublicService,
} from "./projections";

const latestAppointment = (items: AppointmentView[]): AppointmentView | null =>
  items.reduce<AppointmentView | null>((latest, item) => {
    const current = item.createdAt ? new Date(item.createdAt) : null;
    const previous = latest?.createdAt ? new Date(latest.createdAt) : null;
    return current && (!previous || current > previous) ? item : latest;
  }, null);

export const getAdminStats = async (): Promise<AdminStats> => {
  const [users, doctors, services, appointments] = await Promise.all([
    readCollection<UserRecord>("users"),
    readCollection<DoctorRecord>("doctors"),
    readCollection<ServiceRecord>("services"),
    listAllAppointments(),
  ]);

  const patients = users
    .filter(({ record }) => record.role === "patient" || !record.role)
    .map(({ key, record }) => toAdminUserView(key, record));
  const doctorViews = doctors.map(({ key, record }) => toPublicDoctor(key, record));
  const serviceViews = services.map(({ key, record }) => toPublicService(key, record));
  const lastAppointment = latestAppointment(appointments);
  const lastUser = lastAppointment
    ? patients.find((user) => user.id === lastAppointment.user.id)
    : undefined;
  const lastDoctor = lastAppointment
    ? doctorViews.find((doctor) => doctor.id === lastAppointment.doctorId)
    : undefined;

  return {
    users: {
      total: patients.length,
      lastActiveUser:
        lastUser && lastAppointment
          ? { name: lastUser.name, lastActive: lastAppointment.createdAt }
          : null,
    },
    doctors: {
      total: doctorViews.length,
      lastActiveDoctor:
        lastDoctor && lastAppointment
          ? { name: lastDoctor.name, lastActive: lastAppointment.createdAt }
          : null,
    },
    services: {
      total: serviceViews.length,
      lastService: serviceViews.at(-1) ?? null,
    },
    appointments: {
      total: appointments.length,
      lastAppointment: lastAppointment
        ? {
            userName: lastAppointment.user.name,
            createdAt: lastAppointment.createdAt,
          }
        : null,
    },
  };
};

export interface ManagedUsers {
  patients: AdminUserView[];
  admins: AdminUserView[];
}

export const listManagedUsers = async (
  excludedKey: string | null
): Promise<ManagedUsers> => {
  const users = (await readCollection<UserRecord>("users"))
    .map(({ key, record }) => toAdminUserView(key, record))
    .filter((user) => user.id !== excludedKey && user.id !== "1");
  return {
    patients: users.filter((user) => user.role === "patient" || !user.role),
    admins: users.filter((user) => user.role === "admin"),
  };
};

export const setUserRole = async (
  session: Session,
  key: string,
  role: unknown
): Promise<void> => {
  if (role !== "admin" && role !== "patient") {
    throw new HttpError(400, "Invalid role.");
  }
  if (!isValidFirebaseKey(key)) throw new HttpError(404, "User not found.");
  if (session.collection === "users" && session.key === key) {
    throw new HttpError(400, "You cannot change your own role.");
  }
  const record = await readValue<UserRecord>(`users/${key}`);
  if (!record) throw new HttpError(404, "User not found.");
  await getAdminDatabase().ref(`users/${key}`).update({ role });
};

export const listDoctorsForAdmin = async (): Promise<AdminDoctorRow[]> =>
  (await readCollection<DoctorRecord>("doctors")).map(({ key, record }) => ({
    firebaseKey: key,
    id: normalizeId(record.id),
    name: text(record.name),
    email: text(record.email),
    photo: text(record.photo),
    gender: text(record.gender),
  }));

export const deleteDoctor = async (key: string): Promise<void> => {
  if (!isValidFirebaseKey(key)) throw new HttpError(404, "Doctor not found.");
  const record = await readValue<DoctorRecord>(`doctors/${key}`);
  if (!record) throw new HttpError(404, "Doctor not found.");
  await deleteAccountCompletely(toAccount("doctors", key, record));
};

interface ServiceInput {
  name: string;
  desc: string;
  image: string;
}

const readServiceInput = (body: JsonBody, currentImage?: string): ServiceInput => {
  const name = cleanText(body.name, 80);
  const desc = cleanText(body.desc, 1000);
  if (!name || !desc) throw new HttpError(400, "Please fill in all fields.");
  const image = typeof body.image === "string" ? body.image : "";
  if (image && image !== currentImage && !isTrustedImageUrl(image)) {
    throw new HttpError(400, "Image must be uploaded through the image uploader.");
  }
  return { name, desc, image };
};

export type NewService = ServiceInput & Required<Pick<ServiceRecord, "id" | "bgColor" | "textColor" | "createdAt">>;

export const createService = async (body: JsonBody): Promise<NewService> => {
  const input = readServiceInput(body);
  if (!input.image) {
    throw new HttpError(400, "Please fill in all fields. Missing: Image");
  }
  const service: NewService = {
    ...input,
    id: `srv${Date.now()}`,
    bgColor: "rgba(75, 192, 192, .2)",
    textColor: "#4BC0C0",
    createdAt: new Date().toISOString(),
  };
  await getAdminDatabase().ref("services").push(service);
  return service;
};

export const findServiceById = async (id: string): Promise<PublicService | null> => {
  const [match] = await queryByChildVariants<ServiceRecord>("services", "id", id);
  if (match) return toPublicService(match.key, match.record);
  return (
    (await readCollection<ServiceRecord>("services"))
      .map(({ key, record }) => toPublicService(key, record))
      .find((service) => service.id === id) ?? null
  );
};

export const updateService = async (key: string, body: JsonBody): Promise<void> => {
  const current = isValidFirebaseKey(key)
    ? await readValue<ServiceRecord>(`services/${key}`)
    : null;
  if (!current) throw new HttpError(404, "Service not found.");
  const input = readServiceInput(body, current.image);
  const updates = Object.fromEntries(
    Object.entries(input).filter(
      ([field, value]) => value && value !== current[field]
    )
  );
  if (Object.keys(updates).length === 0) return;
  await getAdminDatabase().ref(`services/${key}`).update(updates);
};

export const deleteService = async (key: string): Promise<void> => {
  if (!isValidFirebaseKey(key) || !(await readValue<ServiceRecord>(`services/${key}`))) {
    throw new HttpError(404, "Service not found.");
  }
  await getAdminDatabase().ref(`services/${key}`).remove();
};

export const readAppointmentUpdate = (
  body: JsonBody
): Pick<AppointmentRecord, "timeSlot" | "ticketPrice" | "state"> & {
  timeSlot: string;
  ticketPrice: string;
  state: string;
} => {
  const timeSlot = cleanText(body.timeSlot, 100);
  const ticketPrice = parseTicketPrice(body.ticketPrice);
  if (!timeSlot) throw new HttpError(400, "Time slot is required");
  if (body.ticketPrice === "" || ticketPrice === null) {
    throw new HttpError(400, "Invalid ticket price");
  }
  if (!isAppointmentState(body.state)) {
    throw new HttpError(400, "Invalid state");
  }
  return { timeSlot, ticketPrice: String(body.ticketPrice), state: body.state };
};
