import { describe, expect, it } from "vitest";
import {
  canRegisterRole,
  collectionForNewAccount,
  collectionSearchOrder,
  dashboardPathForRole,
  resolveRole,
} from "@/lib/shared/roles";

describe("resolveRole", () => {
  it("derives the role from the collection, not from client input", () => {
    expect(resolveRole("doctors", { role: "admin" })).toBe("doctor");
    expect(resolveRole("admin", { role: "patient" })).toBe("admin");
    expect(resolveRole("admins", {})).toBe("admin");
  });

  it("supports admins promoted inside the users collection", () => {
    expect(resolveRole("users", { role: "admin" })).toBe("admin");
    expect(resolveRole("users", { role: "patient" })).toBe("patient");
    expect(resolveRole("users", {})).toBe("patient");
  });

  it("rejects unknown collections and missing records", () => {
    expect(resolveRole("appointments", { role: "admin" })).toBeNull();
    expect(resolveRole("users", null)).toBeNull();
  });
});

describe("canRegisterRole", () => {
  it("lets anonymous visitors create only patient accounts", () => {
    expect(canRegisterRole("patient", null)).toBe(true);
    expect(canRegisterRole("doctor", null)).toBe(false);
    expect(canRegisterRole("admin", null)).toBe(false);
  });

  it("prevents patients and doctors from creating privileged accounts", () => {
    expect(canRegisterRole("doctor", "patient")).toBe(false);
    expect(canRegisterRole("admin", "doctor")).toBe(false);
  });

  it("lets admins create doctors and admins", () => {
    expect(canRegisterRole("doctor", "admin")).toBe(true);
    expect(canRegisterRole("admin", "admin")).toBe(true);
    expect(canRegisterRole("patient", "admin")).toBe(false);
    expect(canRegisterRole("superuser", "admin")).toBe(false);
  });
});

describe("role routing helpers", () => {
  it("maps roles to collections and dashboards", () => {
    expect(collectionForNewAccount("doctor")).toBe("doctors");
    expect(collectionForNewAccount("admin")).toBe("admin");
    expect(collectionForNewAccount("patient")).toBe("users");
    expect(dashboardPathForRole("doctor")).toBe("/doctors/profile/me");
    expect(dashboardPathForRole("admin")).toBe("/admin/profile/me");
    expect(dashboardPathForRole("patient")).toBe("/user/profile/me");
  });

  it("searches the preferred role's collections first", () => {
    expect(collectionSearchOrder("doctor")[0]).toBe("doctors");
    expect(collectionSearchOrder("admin").slice(0, 2)).toEqual([
      "admin",
      "admins",
    ]);
    expect(collectionSearchOrder("patient")[0]).toBe("users");
  });
});
