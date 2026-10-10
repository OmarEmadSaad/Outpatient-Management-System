import { describe, expect, it } from "vitest";
import type { ClassifiedAccount, Status } from "../scripts/legacyAccountTypes.ts";
import { applyDecisions, type Decisions } from "../scripts/migrationPlan.ts";

const account = (
  collection: string,
  key: string,
  email: string,
  status: Status
): ClassifiedAccount => ({
  collection,
  key,
  email,
  password: "secret",
  status,
  record: { password: "secret", email, name: key, id: key, role: undefined },
});

const decisions = (
  entries: [string, Decisions extends ReadonlyMap<string, infer D> ? D : never][]
): Decisions => new Map(entries);

describe("migration decisions", () => {
  const accounts = [
    account("users", "0", "a@example.com", "duplicate-email"),
    account("users", "6", "a@example.com", "duplicate-email"),
    account("doctors", "2", "d@example.com", "duplicate-email"),
    account("doctors", "5", "d@example.com", "duplicate-email"),
    account("users", "3", "b@example.com", "migratable"),
  ];

  it("resolves a duplicate group to exactly one canonical login", () => {
    const planned = applyDecisions(
      accounts,
      decisions([
        ["users/6", { status: "DUPLICATE_AUTH_IDENTITY", canonical: "users/0", reason: "" }],
        ["doctors/5", { status: "AUTH_REQUIRES_EMAIL", canonical: "doctors/5", reason: "" }],
      ])
    );
    const status = (path: string) =>
      planned.find((row) => `${row.collection}/${row.key}` === path)?.status;
    expect(status("users/0")).toBe("migratable");
    expect(status("users/6")).toBe("duplicate-auth-identity");
    expect(status("doctors/2")).toBe("migratable");
    expect(status("doctors/5")).toBe("auth-requires-email");
    expect(status("users/3")).toBe("migratable");
    const emails = planned
      .filter((row) => row.status === "migratable")
      .map((row) => row.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("keeps a group ambiguous when no decision is given", () => {
    const planned = applyDecisions(accounts, decisions([]));
    expect(planned.filter((row) => row.status === "migratable")).toHaveLength(1);
  });

  it("rejects a canonical record with a different email", () => {
    expect(() =>
      applyDecisions(
        accounts,
        decisions([
          ["users/6", { status: "DUPLICATE_AUTH_IDENTITY", canonical: "users/3", reason: "" }],
        ])
      )
    ).toThrow(/another email/);
  });

  it("rejects decisions about records that do not exist", () => {
    expect(() =>
      applyDecisions(
        accounts,
        decisions([
          ["users/9", { status: "DUPLICATE_AUTH_IDENTITY", canonical: "users/0", reason: "" }],
        ])
      )
    ).toThrow(/unknown record/);
  });
});
