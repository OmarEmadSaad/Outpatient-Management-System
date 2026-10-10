import { describe, expect, it } from "vitest";
import {
  calculateExpectedTime,
  convertTime,
  extractStartTime,
  findMatchingSlotLabel,
  formatExpectedTime,
  formatTimeSlotLabel,
  listTimeSlotLabels,
} from "@/lib/shared/timeSlots";
import type { CompleteTimeSlot } from "@/lib/shared/timeSlots";
import type { TimeSlotRecord } from "@/types/firebase";

describe("convertTime", () => {
  it("matches the legacy 12-hour formatting", () => {
    expect(convertTime("09:00")).toBe("09:00 am");
    expect(convertTime("12:30")).toBe("12:30 pm");
    expect(convertTime("17:05")).toBe("05:05 pm");
    expect(convertTime("00:15")).toBe("00:15 am");
    expect(convertTime("")).toBe("N/A");
    expect(convertTime("9")).toBe("N/A");
  });
});

describe("time slot labels", () => {
  const saturday: CompleteTimeSlot = {
    day: "sat",
    startingTime: "09:00",
    endingTime: "12:00",
  };
  const slots: TimeSlotRecord[] = [
    saturday,
    { day: "Mon", startingTime: "14:00" },
  ];

  it("formats labels exactly as the booking select shows them", () => {
    expect(formatTimeSlotLabel(saturday)).toBe("Sat: 09:00 am - 12:00 pm");
    expect(listTimeSlotLabels(slots)).toEqual(["Sat: 09:00 am - 12:00 pm"]);
    expect(listTimeSlotLabels({ a: saturday })).toEqual([
      "Sat: 09:00 am - 12:00 pm",
    ]);
  });

  it("accepts only labels generated from the doctor's own schedule", () => {
    expect(findMatchingSlotLabel("Sat: 09:00 am - 12:00 pm", slots)).toBe(
      "Sat: 09:00 am - 12:00 pm"
    );
    expect(findMatchingSlotLabel("Sat: 01:00 am - 11:00 pm", slots)).toBeNull();
    expect(findMatchingSlotLabel("Mon: 02:00 pm - N/A", slots)).toBeNull();
    expect(findMatchingSlotLabel("", slots)).toBeNull();
    expect(findMatchingSlotLabel({ injected: true }, slots)).toBeNull();
  });
});

describe("expected visit time", () => {
  it("adds 15 minutes per queue position", () => {
    expect(extractStartTime("Sat: 09:00 am - 12:00 pm")).toBe("09:00 am");
    expect(calculateExpectedTime("09:00 am", 1)).toBe("9:15 AM");
    expect(calculateExpectedTime("11:50 am", 2)).toBe("12:20 PM");
    expect(calculateExpectedTime("12:00 am", 4)).toBe("1:00 AM");
    expect(calculateExpectedTime("bad", 1)).toBe("Not specified");
  });

  it("hides invalid stored times", () => {
    expect(formatExpectedTime("NaN:NaN AM")).toBe("Not specified");
    expect(formatExpectedTime("")).toBe("Not specified");
    expect(formatExpectedTime("9:15 AM")).toBe("9:15 AM");
  });
});
