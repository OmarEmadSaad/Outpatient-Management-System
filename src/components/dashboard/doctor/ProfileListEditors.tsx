"use client";

import { AiOutlineDelete } from "react-icons/ai";
import { DOCTOR_SLOT_DAYS } from "@/lib/shared/timeSlots";
import type { ChangeEvent, ChangeEventHandler } from "react";
import type {
  ExperienceRecord,
  QualificationRecord,
  TimeSlotRecord,
} from "@/types/firebase";

type ListFieldEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement>;

interface ListEditorHandlers<T> {
  items: T[];
  onChange: (event: ListFieldEvent, index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

interface DateInputProps {
  label: string;
  name: string;
  value: string | undefined;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

interface TextField {
  name: string;
  label: string;
}

interface DatedListEditorProps
  extends ListEditorHandlers<QualificationRecord | ExperienceRecord> {
  title: string;
  textFields: TextField[];
  addLabel: string;
  deleteLabel: string;
}

const dayOptions = (currentDay: string | undefined): readonly string[] =>
  currentDay && !DOCTOR_SLOT_DAYS.some((day) => day === currentDay)
    ? [currentDay, ...DOCTOR_SLOT_DAYS]
    : DOCTOR_SLOT_DAYS;

const deleteButtonClass =
  "bg-red-600 p-2 rounded-full text-white text-[18px] hover:bg-red-700 transition";
const addButtonClass =
  "bg-black py-2 px-4 rounded text-white text-sm hover:bg-gray-800 transition";

const DateInput = ({ label, name, value, onChange }: DateInputProps) => (
  <div>
    <p className="form__label">{label}</p>
    <input
      type="date"
      name={name}
      aria-label={label}
      value={value || ""}
      onChange={onChange}
      className="form__input w-full"
      required
    />
  </div>
);

export function DatedListEditor({
  title,
  items,
  textFields,
  onChange,
  onAdd,
  onDelete,
  addLabel,
  deleteLabel,
}: DatedListEditorProps) {
  return (
    <div className="mb-5">
      <p className="form__label">{title}</p>
      {items.map((item, index) => {
        const handleChange = (event: ListFieldEvent) => onChange(event, index);
        return (
          <div key={index} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateInput
                label="Starting Date*"
                name="startingDate"
                value={item.startingDate}
                onChange={handleChange}
              />
              <DateInput
                label="Ending Date*"
                name="endingDate"
                value={item.endingDate}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {textFields.map((field) => (
                <div key={field.name}>
                  <p className="form__label">{field.label}</p>
                  <input
                    type="text"
                    name={field.name}
                    aria-label={field.label}
                    value={String(item[field.name] || "")}
                    onChange={handleChange}
                    className="form__input w-full"
                    required
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`${deleteButtonClass} mt-4`}
              onClick={() => onDelete(index)}
              aria-label={deleteLabel}
            >
              <AiOutlineDelete />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={onAdd} className={addButtonClass}>
        {addLabel}
      </button>
    </div>
  );
}

export function TimeSlotsEditor({
  items,
  onChange,
  onAdd,
  onDelete,
}: ListEditorHandlers<TimeSlotRecord>) {
  return (
    <div className="mb-5">
      <p className="form__label mb-4">Time Slots*</p>
      {items.map((item, index) => {
        const handleChange = (event: ListFieldEvent) => onChange(event, index);
        return (
          <div
            key={index}
            className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4"
          >
            <select
              name="day"
              aria-label="Day"
              value={item.day || ""}
              onChange={handleChange}
              className="form__input py-2.5 w-full sm:w-1/3"
              required
            >
              <option value="">Select</option>
              {dayOptions(item.day).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <input
              type="time"
              name="startingTime"
              aria-label="Starting time"
              value={item.startingTime || ""}
              onChange={handleChange}
              className="form__input py-2.5 w-full sm:w-1/3"
              required
            />
            <input
              type="time"
              name="endingTime"
              aria-label="Ending time"
              value={item.endingTime || ""}
              onChange={handleChange}
              className="form__input py-2.5 w-full sm:w-1/3"
              required
            />
            <button
              type="button"
              onClick={() => onDelete(index)}
              className={deleteButtonClass}
              aria-label="Delete time slot"
            >
              <AiOutlineDelete />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={onAdd} className={addButtonClass}>
        Add Time Slot
      </button>
    </div>
  );
}
