import type {
  AppointmentView,
  ClientUser,
  PublicService,
  ReviewWithAuthor,
  Role,
} from "./domain";

export interface ApiErrorBody {
  error: string;
}

export interface MeResponse {
  user: ClientUser | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: Role;
}

export interface LoginResponse {
  user: ClientUser;
}

export interface RegisterResponse {
  role: Role;
}

export interface MessageResponse {
  message: string;
}

export interface OkResponse {
  ok: true;
}

export interface ChangedResponse {
  changed: boolean;
}

export interface BookingResponse {
  appointment: AppointmentView;
}

export interface ReviewResponse {
  review: ReviewWithAuthor;
}

export interface AppointmentUpdateResponse {
  appointment: AppointmentView;
}

export interface ServiceResponse {
  service: Omit<PublicService, "key">;
}

export type UploadPurpose = "avatar" | "service";

export type UploadSignatureResponse =
  | { signed: false }
  | {
      signed: true;
      cloudName: string;
      apiKey: string;
      allowed_formats: string;
      folder: string;
      public_id: string;
      transformation: string;
      timestamp: number;
      signature: string;
    };

export interface CloudinaryUploadResult {
  secure_url?: string;
  public_id?: string;
  error?: { message: string };
}
