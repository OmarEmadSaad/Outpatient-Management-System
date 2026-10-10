export type Status =
  | "migratable"
  | "invalid-email"
  | "duplicate-email"
  | "duplicate-auth-identity"
  | "auth-requires-email"
  | "needs-password-reset"
  | "email-linked-to-another-record";

export interface LegacyRecord {
  password: string | number;
  email: unknown;
  name: unknown;
  id: unknown;
  role: unknown;
}

export interface LegacyAccount {
  collection: string;
  key: string;
  record: LegacyRecord;
}

export interface ClassifiedAccount extends LegacyAccount {
  email: string;
  password: string;
  status: Status;
  canonical?: string;
  reason?: string;
}
