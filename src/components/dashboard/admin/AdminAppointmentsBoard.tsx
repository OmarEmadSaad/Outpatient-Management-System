"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import LocalDateTime from "@/components/ui/LocalDateTime";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction } from "@/lib/client/alerts";
import AppointmentEditModal, {
  type AppointmentEditForm,
} from "./AppointmentEditModal";
import type { AppointmentView } from "@/types/domain";
import type { AppointmentUpdateResponse, OkResponse } from "@/types/api";

interface AdminAppointmentsBoardProps {
  initialAppointments: AppointmentView[];
}

const EMPTY_FORM: AppointmentEditForm = {
  timeSlot: "",
  ticketPrice: "",
  state: "",
};

const stateLabel = (state: string) =>
  state === "not come"
    ? "Not Attended"
    : state === "un"
    ? "Unconfirmed"
    : "Completed";

export default function AdminAppointmentsBoard({
  initialAppointments,
}: AdminAppointmentsBoardProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selected, setSelected] = useState<AppointmentView | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const openDetails = (appointment: AppointmentView) => {
    setSelected(appointment);
    setEditForm({
      timeSlot: appointment.timeSlot || "",
      ticketPrice: appointment.ticketPrice || "",
      state: appointment.state || "un",
    });
  };

  const closeModal = () => {
    setSelected(null);
    setEditForm(EMPTY_FORM);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    if (!selected) return;
    const unchanged =
      editForm.timeSlot === selected.timeSlot &&
      String(editForm.ticketPrice) === String(selected.ticketPrice) &&
      editForm.state === selected.state;
    if (unchanged) {
      toast.info("No changes to save");
      closeModal();
      return;
    }
    try {
      const { appointment } = await apiRequest<AppointmentUpdateResponse>(
        `/api/admin/appointments/${selected.key}`,
        { method: "PATCH", body: editForm }
      );
      setAppointments((current) =>
        current.map((item) =>
          item.key === selected.key ? { ...item, ...appointment } : item
        )
      );
      toast.success("Appointment updated successfully");
      closeModal();
    } catch (error) {
      toast.error("Failed to update appointment: " + errorText(error));
    }
  };

  const handleDelete = async (appointment: AppointmentView) => {
    const confirmed = await confirmAction({
      title: "Confirm Deletion",
      text: `Are you sure you want to delete the appointment for ${appointment.user.name}? This action cannot be undone.`,
      icon: "warning",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    if (!confirmed) return;
    try {
      await apiRequest<OkResponse>(
        `/api/admin/appointments/${appointment.key}`,
        {
          method: "DELETE",
        }
      );
      setAppointments((current) =>
        current.filter((item) => item.key !== appointment.key)
      );
      toast.success("Appointment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete appointment: " + errorText(error));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-headingColor mb-6">
        All Appointments
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {appointments.length === 0 ? (
          <p className="text-base text-textColor col-span-full">
            No appointments available.
          </p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.key}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200 transition-shadow"
            >
              <h2 className="text-lg font-semibold text-headingColor mb-1">
                {appointment.user.name}
              </h2>
              <p className="text-sm text-textColor">
                Doctor:{" "}
                <span className="font-medium">{appointment.doctor.name}</span>
              </p>
              <p className="text-sm text-textColor">
                Date:{" "}
                <span className="font-medium">
                  <LocalDateTime value={appointment.createdAt} />
                </span>
              </p>
              <p className="text-sm text-textColor">
                State:{" "}
                <span className="font-medium capitalize">
                  {stateLabel(appointment.state)}
                </span>
              </p>
              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => openDetails(appointment)}
                  className="text-sm text-blue-600 hover:underline hover:cursor-pointer"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDelete(appointment)}
                  className="text-sm text-red-600 hover:underline hover:cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <AppointmentEditModal
          appointment={selected}
          form={editForm}
          onChange={handleInputChange}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
