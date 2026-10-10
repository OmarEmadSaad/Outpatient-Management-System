import { describe, expect, it } from "vitest";
import {
  generateRecordId,
  generateTemporaryPassword,
  passwordsMatch,
} from "@/lib/server/accounts";
import { consumeRateLimit, resetRateLimits } from "@/lib/server/rateLimit";
import { isStrongPassword } from "@/lib/shared/validation";

describe("legacy password comparison", () => {
  it("matches only identical strings", () => {
    expect(passwordsMatch("Patient123", "Patient123")).toBe(true);
    expect(passwordsMatch("Patient123", "patient123")).toBe(false);
    expect(passwordsMatch(undefined, "Patient123")).toBe(false);
    expect(passwordsMatch("Patient123", undefined)).toBe(false);
    expect(passwordsMatch("", "")).toBe(false);
    expect(passwordsMatch(123456, "123456")).toBe(true);
    expect(passwordsMatch("Spaced@77 ", "Spaced@77")).toBe(true);
    expect(passwordsMatch({ value: "x" }, "x")).toBe(false);
  });
});

describe("generated secrets", () => {
  it("creates strong temporary passwords and unpredictable ids", () => {
    const password = generateTemporaryPassword();
    expect(isStrongPassword(password)).toBe(true);
    expect(password.length).toBeGreaterThan(30);
    expect(generateRecordId()).toMatch(/^[0-9a-f]{10}$/);
    expect(generateRecordId()).not.toBe(generateRecordId());
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and recovers after the window", () => {
    resetRateLimits();
    const options = { limit: 2, windowMs: 1000 };
    expect(consumeRateLimit("login:test", options, 0)).toBe(true);
    expect(consumeRateLimit("login:test", options, 10)).toBe(true);
    expect(consumeRateLimit("login:test", options, 20)).toBe(false);
    expect(consumeRateLimit("login:other", options, 20)).toBe(true);
    expect(consumeRateLimit("login:test", options, 1001)).toBe(true);
  });
});
