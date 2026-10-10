"use client";

import { useRef } from "react";
import type { ChangeEventHandler } from "react";
import useDialogFocus from "@/components/ui/useDialogFocus";
import type { AppointmentView } from "@/types/domain";

export interface AppointmentEditForm {
  timeSlot: string;
  ticketPrice: string | number;
  state: string;
}

interface DetailRowProps {
  label: string;
  value: string;
}

interface AppointmentEditModalProps {
  appointment: AppointmentView;
  form: AppointmentEditForm;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onSave: () => void;
  onClose: () => void;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex justify-between text-sm border-b pb-1">
    <span className="font-medium text-textColor">{label}:</span>
    <span>{value}</span>
  </div>
);

export default function AppointmentEditModal({
  appointment,
  form,
  onChange,
  onSave,
  onClose,
}: AppointmentEditModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
        className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
      >
        <h2
          id="appointment-details-title"
          className="text-xl font-bold text-headingColor mb-4"
        >
          Appointment Details
        </h2>
        <div className="space-y-3">
          <DetailRow label="Appointment ID" value={appointment.id} />
          <DetailRow label="Patient Name" value={appointment.user.name} />
          <DetailRow label="Doctor Name" value={appointment.doctor.name} />
          <div className="flex flex-col gap-2 mt-4">
            <label htmlFor="edit-time-slot" className="text-sm">
              Time Slot:
            </label>
            <input
              id="edit-time-slot"
              type="text"
              name="timeSlot"
              value={form.timeSlot}
              onChange={onChange}
              className="border rounded px-2 py-1 text-sm"
            />
            <label htmlFor="edit-ticket-price" className="text-sm">
              Ticket Price:
            </label>
            <input
              id="edit-ticket-price"
              type="number"
              name="ticketPrice"
              value={form.ticketPrice}
              onChange={onChange}
              className="border rounded px-2 py-1 text-sm"
            />
            <label htmlFor="edit-state" className="text-sm">
              State:
            </label>
            <select
              id="edit-state"
              name="state"
              value={form.state}
              onChange={onChange}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="un">Unconfirmed</option>
              <option value="done">Completed</option>
              <option value="not come">Not Attended</option>
            </select>
          </div>
          <div className="flex justify-end mt-4 gap-3">
            <button
              onClick={onSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 hover:cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
