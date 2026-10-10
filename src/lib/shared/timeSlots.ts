import type { LegacyList, TimeSlotRecord } from "@/types/firebase";

export const QUEUE_INTERVAL_MINUTES = 15;

export const DOCTOR_SLOT_DAYS = [
  "Sat",
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
] as const;

export type CompleteTimeSlot = TimeSlotRecord & {
  day: string;
  startingTime: string;
  endingTime: string;
};

export const convertTime = (time: unknown): string => {
  if (!time || typeof time !== "string") return "N/A";

  const [hoursText, minutesText] = time.split(":");
  if (hoursText === undefined || minutesText === undefined) return "N/A";

  let hours = parseInt(hoursText, 10);
  const minutes = parseInt(minutesText, 10);
  const meridiem = hours >= 12 ? "pm" : "am";
  if (hours > 12) hours -= 12;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${meridiem}`;
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const isCompleteSlot = (
  slot: TimeSlotRecord | null | undefined
): slot is CompleteTimeSlot =>
  Boolean(
    slot &&
      typeof slot.day === "string" &&
      slot.day &&
      typeof slot.startingTime === "string" &&
      slot.startingTime &&
      typeof slot.endingTime === "string" &&
      slot.endingTime
  );

export const formatTimeSlotLabel = (slot: CompleteTimeSlot): string =>
  `${capitalize(slot.day)}: ${convertTime(slot.startingTime)} - ${convertTime(
    slot.endingTime
  )}`;

const slotsAsArray = (
  timeSlots: LegacyList<TimeSlotRecord> | null | undefined
): Array<TimeSlotRecord | null> =>
  Array.isArray(timeSlots) ? timeSlots : Object.values(timeSlots ?? {});

export const listTimeSlotLabels = (
  timeSlots: LegacyList<TimeSlotRecord> | null | undefined
): string[] =>
  slotsAsArray(timeSlots).filter(isCompleteSlot).map(formatTimeSlotLabel);

export const findMatchingSlotLabel = (
  selectedLabel: unknown,
  timeSlots: LegacyList<TimeSlotRecord> | null | undefined
): string | null => {
  if (typeof selectedLabel !== "string" || !selectedLabel.trim()) return null;
  return (
    listTimeSlotLabels(timeSlots).find((label) => label === selectedLabel) ??
    null
  );
};

export const extractStartTime = (slotLabel: unknown): string | null => {
  const match =
    typeof slotLabel === "string"
      ? slotLabel.match(/(\d{1,2}:\d{2} [AP]M)/i)
      : null;
  return match ? match[0] : null;
};

export const toMinutesOfDay = (timeLabel: string): number | null => {
  const isPM = timeLabel.toLowerCase().includes("pm");
  const [hoursText = "", minutesText = ""] = timeLabel
    .replace(/ ?(AM|PM)/i, "")
    .trim()
    .split(":");
  let hours = parseInt(hoursText, 10);
  const minutes = parseInt(minutesText, 10) || 0;
  if (Number.isNaN(hours)) return null;
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const calculateExpectedTime = (
  startTime: string | null | undefined,
  queueNumber: number
): string => {
  if (!startTime || !startTime.includes(":")) return "Not specified";

  const startMinutes = toMinutesOfDay(startTime.trim());
  if (startMinutes === null) return "Not specified";

  const totalMinutes = startMinutes + queueNumber * QUEUE_INTERVAL_MINUTES;
  const expectedHours = Math.floor(totalMinutes / 60) % 24;
  const expectedMinutes = totalMinutes % 60;
  const period = expectedHours >= 12 ? "PM" : "AM";
  const displayHours = expectedHours % 12 || 12;

  return `${displayHours}:${expectedMinutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

export const formatExpectedTime = (time: string | null | undefined): string =>
  !time || time.includes("NaN") || time === "Not specified"
    ? "Not specified"
    : time;
