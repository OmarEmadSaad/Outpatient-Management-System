export type LegacyId = string | number;

export type LegacyList<T> = T[] | Record<string, T | null>;

export interface ExtraFields {
  [field: string]: unknown;
}

export interface QualificationRecord extends ExtraFields {
  startingDate?: string;
  endingDate?: string;
  degree?: string;
  university?: string;
}

export interface ExperienceRecord extends ExtraFields {
  startingDate?: string;
  endingDate?: string;
  position?: string;
  hospital?: string;
}

export interface TimeSlotRecord extends ExtraFields {
  day?: string;
  startingTime?: string;
  endingTime?: string;
}

export interface AccountRecordBase extends ExtraFields {
  id?: LegacyId;
  name?: string;
  email?: string;
  password?: string | number;
  photo?: string;
  gender?: string;
  role?: string;
  authUid?: string;
}

export interface UserRecord extends AccountRecordBase {
  bloodType?: string;
  phoneNumber?: string;
}

export interface DoctorRecord extends AccountRecordBase {
  phone?: string | number;
  bio?: string;
  about?: string;
  specialization?: string;
  ticketPrice?: string | number;
  qualifications?: LegacyList<QualificationRecord>;
  experiences?: LegacyList<ExperienceRecord>;
  timeSlots?: LegacyList<TimeSlotRecord>;
  avgRating?: number | string;
  totalRating?: number | string;
  totalPatients?: number | string;
  hospital?: string;
  isApproved?: string;
}

export type AdminRecord = AccountRecordBase;

export type AccountRecord = UserRecord | DoctorRecord | AdminRecord;

export interface ServiceRecord extends ExtraFields {
  id?: LegacyId;
  name?: string;
  desc?: string;
  image?: string;
  bgColor?: string;
  textColor?: string;
  createdAt?: string;
}

export interface ReviewRecord extends ExtraFields {
  id?: LegacyId;
  userId?: LegacyId;
  doctorId?: LegacyId;
  rating?: number | string;
  reviewText?: string;
  createdAt?: string;
  role?: string;
}

export interface AppointmentPartyRecord extends ExtraFields {
  id?: LegacyId;
  name?: string;
  email?: string;
  photo?: string;
  gender?: string;
  phone?: string | number;
}

export interface AppointmentRecord extends ExtraFields {
  id?: LegacyId;
  user?: AppointmentPartyRecord;
  doctorId?: LegacyId;
  doctor?: AppointmentPartyRecord;
  ticketPrice?: string | number;
  createdAt?: string;
  state?: string;
  timeSlot?: string;
  isPaid?: boolean;
  queueNumber?: number;
  expectedTime?: string;
  isCompleted?: boolean;
}

export type AccountCollection = "users" | "doctors" | "admin" | "admins";

export interface AuthLinkRecord {
  collection: AccountCollection;
  key: string;
  linkedAt: string;
  source?: string;
}

export interface QueueReservationRecord {
  value: number;
  at: number;
}

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface KeyedRecord<T> {
  key: string;
  record: T;
}
