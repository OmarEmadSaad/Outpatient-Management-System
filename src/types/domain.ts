import type {
  AccountCollection,
  AccountRecord,
  ExperienceRecord,
  QualificationRecord,
  TimeSlotRecord,
} from "./firebase";

export type Role = "patient" | "doctor" | "admin";

export interface Account<TRecord extends AccountRecord = AccountRecord> {
  uid: string | null;
  collection: AccountCollection;
  key: string;
  record: TRecord;
  role: Role | null;
}

export interface Session<TRecord extends AccountRecord = AccountRecord>
  extends Account<TRecord> {
  uid: string;
  role: Role;
  authTime?: number;
}

export interface ClientUser {
  role: Role;
  userId: string;
  recordId: string;
  name: string;
  photo: string;
}

export interface PublicDoctor {
  key: string;
  id: string;
  name: string;
  specialization: string;
  photo: string;
  bio: string;
  about: string;
  gender: string;
  hospital: string;
  ticketPrice: number;
  avgRating: number;
  totalRating: number;
  isApproved: string | null;
  qualifications: QualificationRecord[];
  experiences: ExperienceRecord[];
  timeSlots: TimeSlotRecord[];
}

export interface PublicService {
  key: string;
  id: string;
  name: string;
  desc: string;
  image: string;
  bgColor: string;
  textColor: string;
  createdAt: string | null;
}

export interface PublicReview {
  key: string;
  userId: string;
  doctorId: string;
  rating: number;
  reviewText: string;
  createdAt: string | null;
}

export interface ReviewWithAuthor extends PublicReview {
  userName: string;
  userPhoto: string;
}

export interface DoctorDetails {
  doctor: PublicDoctor;
  reviews: ReviewWithAuthor[];
  totalRating: number;
  averageRating: string | number;
}

export interface AppointmentParty {
  id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
}

export interface AppointmentDoctorSnapshot {
  id: string;
  name: string;
  photo: string;
  phone: string;
}

export interface AppointmentView {
  key: string;
  id: string;
  doctorId: string;
  timeSlot: string;
  ticketPrice: string | number;
  createdAt: string | null;
  state: string;
  isPaid: boolean;
  queueNumber: number | null;
  expectedTime: string;
  user: AppointmentParty;
  doctor: AppointmentDoctorSnapshot;
}

export interface ProfileView {
  key: string;
  id: string;
  role: Role | null;
  name: string;
  email: string;
  photo: string;
  gender: string;
  bloodType: string;
  phoneNumber: string;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
  role: string;
}

export interface AdminDoctorRow {
  firebaseKey: string;
  id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
}

export interface AdminStats {
  users: {
    total: number;
    lastActiveUser: { name: string; lastActive: string | null } | null;
  };
  doctors: {
    total: number;
    lastActiveDoctor: { name: string; lastActive: string | null } | null;
  };
  services: { total: number; lastService: PublicService | null };
  appointments: {
    total: number;
    lastAppointment: { userName: string; createdAt: string | null } | null;
  };
}

export interface DoctorDashboardData extends PublicDoctor {
  email: string;
  phone: string;
  averageRating: string | number;
}
