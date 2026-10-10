import type {
  ExperienceRecord,
  QualificationRecord,
  TimeSlotRecord,
} from "@/types/firebase";

export const NAME_PATTERN = /^[a-zA-Z0-9\s]{3,15}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PHONE_PATTERN = /^\d{10,15}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const FIREBASE_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const GENDERS: readonly string[] = ["male", "female", "Male", "Female"];
export const APPOINTMENT_STATES = ["un", "done", "not come"] as const;
export const MAX_REVIEW_LENGTH = 500;

export type AppointmentStateValue = (typeof APPOINTMENT_STATES)[number];

const DEFAULT_IMAGE_URLS: readonly string[] = [
  "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of_social_media_user_vector.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Avj4TSMtuTPrA1IqGtlWogrd6D3aZhVwCA98c3NC442QLQU0rmqWv7M&s",
];

export const normalizeEmail = (email: unknown): string =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const isValidEmail = (email: unknown): email is string =>
  typeof email === "string" && EMAIL_PATTERN.test(email.trim());

export const isStrongPassword = (password: unknown): password is string =>
  typeof password === "string" && PASSWORD_PATTERN.test(password.trim());

export const isValidFirebaseKey = (key: unknown): key is string =>
  typeof key === "string" && FIREBASE_KEY_PATTERN.test(key);

export const isAppointmentState = (
  value: unknown
): value is AppointmentStateValue =>
  typeof value === "string" &&
  (APPOINTMENT_STATES as readonly string[]).includes(value);

export const cleanText = (value: unknown, maxLength = 200): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const isTrustedImageUrl = (
  value: unknown,
  cloudName: string | undefined = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
): value is string => {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    if (DEFAULT_IMAGE_URLS.includes(value)) return true;
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.host === "res.cloudinary.com" &&
      Boolean(cloudName) &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
};

export const parseTicketPrice = (value: unknown): number | null => {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= 1000000
    ? price
    : null;
};

export const isValidRating = (rating: unknown): rating is number =>
  typeof rating === "number" &&
  Number.isInteger(rating) &&
  rating >= 1 &&
  rating <= 10;

type ListItem = Record<string, unknown>;

const isListItem = (item: unknown): item is ListItem =>
  Boolean(item) && typeof item === "object" && !Array.isArray(item);

export const toListArray = <T extends object = ListItem>(value: unknown): T[] =>
  (Array.isArray(value)
    ? (value as unknown[])
    : Object.values((value as Record<string, unknown> | null) ?? {})
  ).filter(isListItem) as T[];

const SAFE_EXTRA_KEY = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const MAX_EXTRA_FIELDS = 20;

type ExtraValue = string | number | boolean;

const isExtraValue = (value: unknown): value is ExtraValue =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const preservedExtras = (
  item: ListItem,
  knownFields: string[]
): Record<string, ExtraValue> =>
  Object.fromEntries(
    Object.entries(item)
      .filter(
        (entry): entry is [string, ExtraValue] =>
          !knownFields.includes(entry[0]) &&
          SAFE_EXTRA_KEY.test(entry[0]) &&
          isExtraValue(entry[1])
      )
      .slice(0, MAX_EXTRA_FIELDS)
      .map(([field, value]) => [
        field,
        typeof value === "string" ? value.slice(0, 500) : value,
      ])
  );

const sanitizeList = <K extends string>(
  items: unknown,
  fieldLimits: Record<K, number>,
  maxItems: number
): Array<Record<K, string> & Record<string, ExtraValue>> => {
  const knownFields = Object.keys(fieldLimits) as K[];
  return toListArray(items)
    .slice(0, maxItems)
    .map((item) => ({
      ...preservedExtras(item, knownFields),
      ...(Object.fromEntries(
        knownFields.map((field) => [
          field,
          cleanText(String(item[field] ?? ""), fieldLimits[field]),
        ])
      ) as Record<K, string>),
    }));
};

export const sanitizeQualifications = (items: unknown): QualificationRecord[] =>
  sanitizeList(
    items,
    { startingDate: 40, endingDate: 40, degree: 120, university: 120 },
    20
  );

export const sanitizeExperiences = (items: unknown): ExperienceRecord[] =>
  sanitizeList(
    items,
    { startingDate: 40, endingDate: 40, position: 120, hospital: 120 },
    20
  );

export const sanitizeTimeSlots = (items: unknown): TimeSlotRecord[] =>
  sanitizeList(items, { day: 20, startingTime: 20, endingTime: 20 }, 21);

export interface RegistrationInput {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  gender?: unknown;
  role?: unknown;
  phone?: unknown;
  ticketPrice?: unknown;
  photo?: unknown;
  specialization?: unknown;
}

export type RegistrationErrors = Partial<
  Record<
    "name" | "email" | "password" | "gender" | "role" | "phone" | "ticketPrice" | "photo",
    string
  >
>;

export const validateRegistration = (
  input: RegistrationInput | null | undefined
): RegistrationErrors => {
  const errors: RegistrationErrors = {};
  if (!NAME_PATTERN.test(cleanText(input?.name, 100))) {
    errors.name =
      "Name must be 3-15 characters long and contain only letters, numbers, or spaces.";
  }
  if (!isValidEmail(input?.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!isStrongPassword(input?.password)) {
    errors.password =
      "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number.";
  }
  if (typeof input?.gender !== "string" || !GENDERS.includes(input.gender)) {
    errors.gender = "Please select your gender.";
  }
  if (input?.role === "doctor") {
    const phone = cleanText(input.phone, 20);
    if (phone && !PHONE_PATTERN.test(phone)) {
      errors.phone = "Phone number must be 10-15 digits.";
    }
    if (input.ticketPrice && parseTicketPrice(input.ticketPrice) === null) {
      errors.ticketPrice = "Ticket price must be a number.";
    }
  }
  if (input?.photo && !isTrustedImageUrl(input.photo)) {
    errors.photo = "Photo must be uploaded through the photo uploader.";
  }
  return errors;
};
