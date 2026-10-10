"use client";

import { useState } from "react";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction, showAlert } from "@/lib/client/alerts";
import { formatDate } from "@/lib/shared/ratings";
import type { SweetAlertOptions } from "sweetalert2";
import type { AppointmentView } from "@/types/domain";
import type { OkResponse } from "@/types/api";

type ActionName = "complete" | "notCome";

interface ActionConfig {
  confirm: SweetAlertOptions;
  success: { title: string; text: string };
  failure: string;
}

interface DoctorAppointmentsTableProps {
  appointments: AppointmentView[];
}

const ACTIONS: Record<ActionName, ActionConfig> = {
  complete: {
    confirm: {
      title: "Confirm Visit",
      text: "Are you sure this appointment has been completed? It will be removed permanently.",
      icon: "question",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, confirm",
      cancelButtonText: "No, cancel",
    },
    success: {
      title: "Completed!",
      text: "The appointment has been marked as completed and removed.",
    },
    failure: "Failed to complete appointment. Please try again.",
  },
  notCome: {
    confirm: {
      title: "Cancel Appointment",
      text: "Are you sure you want to cancel this appointment? It will be removed permanently.",
      icon: "warning",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
    },
    success: { title: "Removed!", text: "The appointment has been removed." },
    failure: "Failed to cancel appointment. Please try again.",
  },
};

const HEADERS = ["Name", "Gender", "Payment", "Price"];

export default function DoctorAppointmentsTable({
  appointments,
}: DoctorAppointmentsTableProps) {
  const [items, setItems] = useState(appointments);

  const runAction = async (appointmentKey: string, action: ActionName) => {
    const { confirm, success, failure } = ACTIONS[action];
    if (!(await confirmAction(confirm))) return;
    try {
      await apiRequest<OkResponse>(
        `/api/doctor/appointments/${appointmentKey}`,
        {
          method: "DELETE",
        }
      );
      showAlert({ ...success, icon: "success", confirmButtonColor: "#3085d6" });
      setItems((current) =>
        current.filter((item) => item.key !== appointmentKey)
      );
    } catch (error) {
      showAlert({
        title: "Error!",
        text: errorText(error, failure),
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-600">
        No pending appointments available for you.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1000px] sm:min-w-[110%]">
        <table className="w-full table-auto text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {HEADERS.map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
              <th className="px-4 sm:px-2 py-3">Booked on</th>
              <th className="px-4 py-3 sm:text-center text-center pr-[2em] sm:pr-0">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key}>
                <td className="px-4 py-4 whitespace-nowrap flex items-center">
                  <img
                    src={item.user.photo || DEFAULT_AVATAR_URL}
                    alt=""
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {item.user.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.user.email || "N/A"}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{item.user.gender || "N/A"}</td>
                <td className="px-4 py-4">
                  {item.isPaid ? (
                    <span className="flex items-center text-yellow-600">
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></span>
                      Waiting
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                      Unpaid
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">{item.ticketPrice || "N/A"}</td>
                <td className="px-4 sm:px-0 py-4">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-4 flex items-center space-x-2 justify-center">
                  <div className="flex space-x-2 mb-5">
                    <button
                      onClick={() => runAction(item.key, "complete")}
                      className="bg-blue-500 hover:cursor-pointer text-white text-xs px-3 py-1 rounded whitespace-nowrap"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => runAction(item.key, "notCome")}
                      className="bg-red-500 hover:cursor-pointer text-white text-xs px-3 py-1 rounded whitespace-nowrap"
                    >
                      Not Come
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
