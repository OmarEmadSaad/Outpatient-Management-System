import type {
  Account,
  AdminUserView,
  AppointmentView,
  ProfileView,
  PublicDoctor,
  PublicReview,
  PublicService,
} from "@/types/domain";
import type {
  AppointmentRecord,
  DoctorRecord,
  LegacyList,
  ReviewRecord,
  ServiceRecord,
  UserRecord,
} from "@/types/firebase";

const toArray = <T>(value: LegacyList<T> | null | undefined): T[] =>
  (Array.isArray(value) ? value : Object.values(value ?? {})).filter(
    (item): item is T => item !== null && item !== undefined
  );

export const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);

export const normalizeId = (value: unknown, fallback = ""): string =>
  value === undefined || value === null || value === ""
    ? fallback
    : String(value);

export const publicDoctorId = (
  key: string,
  record: DoctorRecord | null | undefined
): string => normalizeId(record?.id, key);

export const toPublicDoctor = (key: string, record: DoctorRecord): PublicDoctor => ({
  key,
  id: publicDoctorId(key, record),
  name: text(record.name),
  specialization: text(record.specialization),
  photo: text(record.photo),
  bio: text(record.bio),
  about: text(record.about),
  gender: text(record.gender),
  hospital: text(record.hospital),
  ticketPrice: Number(record.ticketPrice) || 0,
  avgRating: Number(record.avgRating) || 0,
  totalRating: Number(record.totalRating) || 0,
  isApproved: record.isApproved || null,
  qualifications: toArray(record.qualifications),
  experiences: toArray(record.experiences),
  timeSlots: toArray(record.timeSlots),
});

export const toPublicService = (key: string, record: ServiceRecord): PublicService => ({
  key,
  id: normalizeId(record.id, key),
  name: text(record.name),
  desc: text(record.desc),
  image: text(record.image),
  bgColor: text(record.bgColor),
  textColor: text(record.textColor),
  createdAt: record.createdAt || null,
});

export const toPublicReview = (key: string, record: ReviewRecord): PublicReview => ({
  key,
  userId: normalizeId(record.userId),
  doctorId: normalizeId(record.doctorId),
  rating: Number(record.rating) || 0,
  reviewText: text(record.reviewText),
  createdAt: record.createdAt || null,
});

export const toAppointmentView = (
  key: string,
  record: AppointmentRecord
): AppointmentView => ({
  key,
  id: normalizeId(record.id, key),
  doctorId: normalizeId(record.doctorId, normalizeId(record.doctor?.id)),
  timeSlot: text(record.timeSlot),
  ticketPrice: record.ticketPrice ?? "",
  createdAt: record.createdAt || null,
  state: record.state || "un",
  isPaid: Boolean(record.isPaid),
  queueNumber: typeof record.queueNumber === "number" ? record.queueNumber : null,
  expectedTime: text(record.expectedTime),
  user: {
    id: normalizeId(record.user?.id),
    name: text(record.user?.name),
    email: text(record.user?.email),
    photo: text(record.user?.photo),
    gender: text(record.user?.gender),
  },
  doctor: {
    id: normalizeId(record.doctor?.id, normalizeId(record.doctorId)),
    name: text(record.doctor?.name),
    photo: text(record.doctor?.photo),
    phone: text(record.doctor?.phone),
  },
});

export const toProfileView = (account: Account<UserRecord>): ProfileView => {
  const { record } = account;
  return {
    key: account.key,
    id: normalizeId(record.id, account.key),
    role: account.role,
    name: text(record.name),
    email: text(record.email),
    photo: text(record.photo),
    gender: text(record.gender),
    bloodType: text(record.bloodType),
    phoneNumber: text(record.phoneNumber),
  };
};

export const toAdminUserView = (key: string, record: UserRecord): AdminUserView => ({
  id: key,
  name: text(record.name),
  email: text(record.email),
  photo: text(record.photo),
  gender: text(record.gender),
  role: record.role || "patient",
});
