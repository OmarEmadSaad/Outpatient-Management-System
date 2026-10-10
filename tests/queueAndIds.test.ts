import { describe, expect, it } from "vitest";
import {
  nextQueueNumber,
  nextQueueReservation,
  QUEUE_RESERVATION_WINDOW_MS,
} from "@/lib/shared/booking";
import type { QueueReservationRecord } from "@/types/firebase";
import { normalizeId, toPublicDoctor } from "@/lib/server/data/projections";
import { signCloudinaryParams } from "@/lib/server/cloudinary";

describe("queue reservations", () => {
  it("counts legacy appointments whose doctorId is stored as a number", () => {
    const appointments = [
      { doctorId: 7, timeSlot: "Tue: 10:00 am - 01:00 pm" },
      { doctorId: "7", timeSlot: "Tue: 10:00 am - 01:00 pm" },
      { doctorId: 8, timeSlot: "Tue: 10:00 am - 01:00 pm" },
    ];
    expect(nextQueueNumber(appointments, "7", "Tue: 10:00 am - 01:00 pm")).toBe(3);
  });

  it("never reuses a queue number after an appointment is deleted", () => {
    const slot = "Tue: 10:00 am - 01:00 pm";
    const remaining = [
      { doctorId: "7", timeSlot: slot, queueNumber: 1 },
      { doctorId: 7, timeSlot: slot, queueNumber: "3" },
    ];
    expect(nextQueueNumber(remaining, "7", slot)).toBe(4);
  });

  it("falls back to counting when legacy records have no queue number", () => {
    const slot = "Tue: 10:00 am - 01:00 pm";
    const legacy = [
      { doctorId: 7, timeSlot: slot },
      { doctorId: "7", timeSlot: slot, queueNumber: "not-a-number" },
      { doctorId: "7", timeSlot: slot, queueNumber: 999999999 },
    ];
    expect(nextQueueNumber(legacy, "7", slot)).toBe(4);
  });

  it("hands out distinct numbers to near-simultaneous bookings", () => {
    let state: QueueReservationRecord | null = null;
    const now = 1000000;
    const numbers = [0, 1, 2].map((offset) => {
      state = nextQueueReservation(state, 1, now + offset);
      return state.value;
    });
    expect(numbers).toEqual([1, 2, 3]);
  });

  it("falls back to the original counting rule once the window passes", () => {
    const stale = { value: 9, at: 0 };
    expect(
      nextQueueReservation(stale, 2, QUEUE_RESERVATION_WINDOW_MS + 1).value
    ).toBe(2);
    expect(nextQueueReservation(stale, 12, 10).value).toBe(12);
  });
});

describe("legacy id normalization", () => {
  it("treats numeric and string ids the same", () => {
    expect(normalizeId(7)).toBe("7");
    expect(normalizeId(0)).toBe("0");
    expect(normalizeId(undefined, "-Nkey")).toBe("-Nkey");
    expect(toPublicDoctor("-Nkey", { id: 7 }).id).toBe("7");
    expect(
      toPublicDoctor("-Nkey", { qualifications: { q1: { degree: "MBBS" } } })
        .qualifications
    ).toEqual([{ degree: "MBBS" }]);
  });
});

describe("Cloudinary signing", () => {
  it("matches Cloudinary's documented signature algorithm", () => {
    const signature = signCloudinaryParams(
      {
        eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
        public_id: "sample_image",
        timestamp: 1315060510,
      },
      "abcd"
    );
    expect(signature).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});
