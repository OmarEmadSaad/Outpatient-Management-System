import "server-only";
import type { Session } from "@/types/domain";
import type { AccountRecord, DoctorRecord, UserRecord } from "@/types/firebase";
import type { JsonBody } from "../http";
import {
  cleanText,
  GENDERS,
  isStrongPassword,
  isTrustedImageUrl,
  parseTicketPrice,
  PHONE_PATTERN,
  sanitizeExperiences,
  sanitizeQualifications,
  sanitizeTimeSlots,
  toListArray,
} from "../../shared/validation";
import { getAdminAuth, getAdminDatabase } from "../firebaseAdmin";
import { HttpError } from "../http";
import { signInWithPassword } from "../identityToolkit";
import { enforceRateLimit } from "../rateLimit";
import { startSession } from "../session";
import { text } from "./projections";

const RECENT_LOGIN_SECONDS = 60 * 60;
const RECENT_LOGIN_MESSAGE =
  "For your security, please log out and log in again before changing your password.";

const WEAK_PASSWORD_MESSAGE =
  "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number.";

export interface ProfileUpdateResult {
  changed: boolean;
}

type FieldUpdates = Record<string, unknown>;

const applyPasswordChange = async (
  session: Session,
  password: unknown
): Promise<boolean> => {
  if (!password) return false;
  if (!isStrongPassword(password)) throw new HttpError(400, WEAK_PASSWORD_MESSAGE);
  const signedInSeconds = Date.now() / 1000 - (session.authTime ?? 0);
  if (signedInSeconds > RECENT_LOGIN_SECONDS) {
    throw new HttpError(401, RECENT_LOGIN_MESSAGE);
  }
  await enforceRateLimit(`password-change:${session.uid}`, {
    windowMs: 60 * 60 * 1000,
    limit: 5,
  });
  const authUser = await getAdminAuth().updateUser(session.uid, {
    password: password.trim(),
  });
  if (!authUser.email) throw new HttpError(409, "Your account has no email address.");
  const { idToken } = await signInWithPassword(authUser.email, password.trim());
  await startSession(idToken);
  return true;
};

const LIST_FIELDS = ["qualifications", "experiences", "timeSlots"];

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
};

const comparable = (field: string, value: unknown): string => {
  if (LIST_FIELDS.includes(field)) return stableStringify(toListArray(value));
  if (field === "ticketPrice") return String(value ?? "");
  return stableStringify(value);
};

const changedFields = (current: AccountRecord, candidate: FieldUpdates): FieldUpdates =>
  Object.fromEntries(
    Object.entries(candidate).filter(
      ([field, value]) => comparable(field, value) !== comparable(field, current[field])
    )
  );

const saveRecordFields = async (session: Session, updates: FieldUpdates): Promise<void> => {
  if (Object.keys(updates).length === 0) return;
  await getAdminDatabase().ref(`${session.collection}/${session.key}`).update(updates);
  Object.assign(session.record, updates);
};

const optionalPhoto = (photo: unknown, currentPhoto: unknown): string | undefined => {
  if (!photo || photo === currentPhoto) return undefined;
  if (!isTrustedImageUrl(photo)) {
    throw new HttpError(400, "Photo must be uploaded through the photo uploader.");
  }
  return photo;
};

const isUnchanged = (session: Session, field: string, value: unknown): boolean =>
  text(value) === text(session.record[field]);

const withoutUndefined = (object: FieldUpdates): FieldUpdates =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

const isProvided = (body: JsonBody, field: string): boolean =>
  Object.prototype.hasOwnProperty.call(body, field);

const textValue = (value: unknown, maxLength: number): string =>
  cleanText(text(value), maxLength);

const isAcceptedGender = (session: Session, gender: unknown): boolean =>
  (typeof gender === "string" && GENDERS.includes(gender)) ||
  isUnchanged(session, "gender", gender);

export const updatePatientProfile = async (
  session: Session<UserRecord>,
  body: JsonBody
): Promise<ProfileUpdateResult> => {
  const name = textValue(isProvided(body, "name") ? body.name : session.record.name, 100);
  if (!name) throw new HttpError(400, "Full name is required");
  if (body.gender && !isAcceptedGender(session, body.gender)) {
    throw new HttpError(400, "Please select a valid gender");
  }

  const candidate = withoutUndefined({
    name,
    photo: optionalPhoto(body.photo, session.record.photo),
    gender: typeof body.gender === "string" && body.gender ? body.gender : undefined,
    bloodType: cleanText(body.bloodType, 5) || undefined,
    phoneNumber: cleanText(body.phoneNumber, 20) || undefined,
  });

  const updates = changedFields(session.record, candidate);
  const passwordChanged = await applyPasswordChange(session, body.password);
  await saveRecordFields(session, updates);
  return { changed: passwordChanged || Object.keys(updates).length > 0 };
};

export const updateDoctorProfile = async (
  session: Session<DoctorRecord>,
  body: JsonBody,
  allowedSpecializations: string[]
): Promise<ProfileUpdateResult> => {
  const current = session.record;
  const value = (field: string): unknown =>
    isProvided(body, field) ? body[field] : current[field];
  const name = textValue(value("name"), 100);
  const specialization = textValue(value("specialization"), 80);
  const phone = textValue(value("phone"), 20);
  const gender = value("gender");
  const ticketPrice = parseTicketPrice(value("ticketPrice") ?? 0);

  if (!name) throw new HttpError(400, "Full name is required");
  if (!isAcceptedGender(session, gender)) {
    throw new HttpError(400, "Please select your gender");
  }
  if (
    !specialization ||
    (!allowedSpecializations.includes(specialization) &&
      specialization !== current.specialization)
  ) {
    throw new HttpError(400, "Specialization is required");
  }
  if (phone && !PHONE_PATTERN.test(phone) && !isUnchanged(session, "phone", phone)) {
    throw new HttpError(400, "Phone number must be 10-15 digits.");
  }
  if (ticketPrice === null) throw new HttpError(400, "Invalid ticket price");

  const candidate: FieldUpdates = {
    name,
    phone,
    bio: textValue(value("bio"), 100),
    gender,
    specialization,
    ticketPrice,
    photo: optionalPhoto(value("photo"), current.photo),
    about: textValue(value("about"), 2000),
    qualifications: sanitizeQualifications(value("qualifications")),
    experiences: sanitizeExperiences(value("experiences")),
    timeSlots: sanitizeTimeSlots(value("timeSlots")),
  };
  const providedOnly = withoutUndefined(
    Object.fromEntries(
      Object.entries(candidate).filter(([field]) => isProvided(body, field))
    )
  );

  const updates = changedFields(current, providedOnly);
  const passwordChanged = await applyPasswordChange(session, body.password);
  await saveRecordFields(session, updates);
  return { changed: passwordChanged || Object.keys(updates).length > 0 };
};
