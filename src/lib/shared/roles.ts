import type { AccountCollection } from "@/types/firebase";
import type { Role } from "@/types/domain";

export const ROLES = Object.freeze({
  patient: "patient",
  doctor: "doctor",
  admin: "admin",
} as const satisfies Record<Role, Role>);

export const SELECTABLE_ROLES: readonly Role[] = [
  ROLES.patient,
  ROLES.doctor,
  ROLES.admin,
];

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" &&
  (SELECTABLE_ROLES as readonly string[]).includes(value);

export const resolveRole = (
  collection: string,
  record: unknown
): Role | null => {
  if (!record || typeof record !== "object") return null;
  if (collection === "doctors") return ROLES.doctor;
  if (collection === "admin" || collection === "admins") return ROLES.admin;
  if (collection === "users") {
    return (record as { role?: unknown }).role === ROLES.admin
      ? ROLES.admin
      : ROLES.patient;
  }
  return null;
};

export const collectionForNewAccount = (role: Role): AccountCollection => {
  if (role === ROLES.doctor) return "doctors";
  if (role === ROLES.admin) return "admin";
  return "users";
};

export const collectionSearchOrder = (
  preferredRole?: Role | null
): AccountCollection[] => {
  if (preferredRole === ROLES.doctor) {
    return ["doctors", "users", "admin", "admins"];
  }
  if (preferredRole === ROLES.admin) {
    return ["admin", "admins", "users", "doctors"];
  }
  return ["users", "doctors", "admin", "admins"];
};

export const dashboardPathForRole = (role: Role): string => {
  if (role === ROLES.doctor) return "/doctors/profile/me";
  if (role === ROLES.admin) return "/admin/profile/me";
  return "/user/profile/me";
};

export const canRegisterRole = (
  requestedRole: unknown,
  actorRole: Role | null
): boolean => {
  if (requestedRole === ROLES.patient) return actorRole !== ROLES.admin;
  if (requestedRole === ROLES.doctor || requestedRole === ROLES.admin) {
    return actorRole === ROLES.admin;
  }
  return false;
};
