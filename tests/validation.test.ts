import { describe, expect, it } from "vitest";
import {
  isTrustedImageUrl,
  isValidFirebaseKey,
  isValidRating,
  normalizeEmail,
  parseTicketPrice,
  sanitizeQualifications,
  sanitizeTimeSlots,
  validateRegistration,
} from "@/lib/shared/validation";

const validPatient = {
  name: "Test Patient",
  email: "patient@example.com",
  password: "Patient123",
  gender: "male",
  role: "patient",
};

describe("validateRegistration", () => {
  it("accepts a valid registration", () => {
    expect(validateRegistration(validPatient)).toEqual({});
  });

  it("enforces the existing password and name rules", () => {
    const errors = validateRegistration({
      ...validPatient,
      password: "weak",
      name: "x",
    });
    expect(errors.password).toMatch(/at least 8 characters/);
    expect(errors.name).toMatch(/3-15 characters/);
  });

  it("rejects photos that were not uploaded through the uploader", () => {
    const errors = validateRegistration({
      ...validPatient,
      photo: "javascript:alert(1)",
    });
    expect(errors.photo).toBeDefined();
  });

  it("validates doctor specific fields", () => {
    const errors = validateRegistration({
      ...validPatient,
      role: "doctor",
      phone: "12",
      ticketPrice: "abc",
    });
    expect(errors.phone).toBeDefined();
    expect(errors.ticketPrice).toBeDefined();
  });
});

describe("input guards", () => {
  it("only trusts https images uploaded to the configured Cloudinary cloud", () => {
    const upload = "https://res.cloudinary.com/demo/image/upload/v1/osm/avatars/a.png";
    expect(isTrustedImageUrl(upload, "demo")).toBe(true);
    expect(isTrustedImageUrl(upload, "other")).toBe(false);
    expect(isTrustedImageUrl(upload, undefined)).toBe(false);
    expect(
      isTrustedImageUrl(
        "https://res.cloudinary.com/demo/image/fetch/https://evil.example/x.png",
        "demo"
      )
    ).toBe(false);
    expect(isTrustedImageUrl(upload.replace("https", "http"), "demo")).toBe(
      false
    );
    expect(isTrustedImageUrl(`${upload}?x=1`, "demo")).toBe(false);
    expect(isTrustedImageUrl("https://static.vecteezy.com/any.png", "demo")).toBe(
      false
    );
    expect(isTrustedImageUrl("https://evil.example/image.png", "demo")).toBe(
      false
    );
    expect(isTrustedImageUrl("not a url", "demo")).toBe(false);
  });

  it("still accepts the app's own default avatar", () => {
    expect(
      isTrustedImageUrl(
        "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
        "demo"
      )
    ).toBe(true);
  });

  it("validates Firebase keys to prevent path traversal", () => {
    expect(isValidFirebaseKey("-Npatient1")).toBe(true);
    expect(isValidFirebaseKey("../admin")).toBe(false);
    expect(isValidFirebaseKey("users/abc")).toBe(false);
    expect(isValidFirebaseKey("")).toBe(false);
  });

  it("parses prices and ratings strictly", () => {
    expect(parseTicketPrice("300")).toBe(300);
    expect(parseTicketPrice(-1)).toBeNull();
    expect(parseTicketPrice("abc")).toBeNull();
    expect(isValidRating(8)).toBe(true);
    expect(isValidRating(11)).toBe(false);
    expect(isValidRating(2.5)).toBe(false);
  });

  it("normalizes emails", () => {
    expect(normalizeEmail("  Omar@Example.COM ")).toBe("omar@example.com");
    expect(normalizeEmail(undefined)).toBe("");
  });

  it("sanitizes nested profile lists without losing legacy data", () => {
    const [qualification] = sanitizeQualifications({
      q1: {
        startingDate: "2010-1-5",
        endingDate: " 2015-06-30 ",
        degree: " MBBS ",
        certificateId: "CERT-99",
        nested: { x: 1 },
      },
    });
    expect(qualification).toEqual({
      certificateId: "CERT-99",
      startingDate: "2010-1-5",
      endingDate: "2015-06-30",
      degree: "MBBS",
      university: "",
    });
    const [slot] = sanitizeTimeSlots([
      { day: "Wednesday", startingTime: "9:30", endingTime: "12:00" },
    ]);
    expect(slot).toEqual({
      day: "Wednesday",
      startingTime: "9:30",
      endingTime: "12:00",
    });
    expect(sanitizeTimeSlots([null, "x", { day: "Mon" }])).toHaveLength(1);
  });
});
