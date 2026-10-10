"use client";

import { useState } from "react";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction, showAlert } from "@/lib/client/alerts";
import type { AdminDoctorRow } from "@/types/domain";
import type { OkResponse } from "@/types/api";

interface DoctorsManagementTableProps {
  initialDoctors: AdminDoctorRow[];
}

const FALLBACK_PHOTO = "https://placehold.co/48x48/cccccc/000000?text=No+Img";
const HEADERS = ["ID", "Photo", "Name", "Email", "Gender", "Action"];
const cellClass = "py-3 px-4 border-b border-gray-200 text-sm text-gray-700";

export default function DoctorsManagementTable({
  initialDoctors,
}: DoctorsManagementTableProps) {
  const [doctors, setDoctors] = useState(initialDoctors);

  const handleDelete = async (doctor: AdminDoctorRow) => {
    const confirmed = await confirmAction({
      title: "Confirm Deletion",
      text: `Are you sure you want to delete ${doctor.name}? This action cannot be undone.`,
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
      await apiRequest<OkResponse>(`/api/admin/doctors/${doctor.firebaseKey}`, {
        method: "DELETE",
      });
      setDoctors((current) =>
        current.filter((item) => item.firebaseKey !== doctor.firebaseKey)
      );
      showAlert({
        title: "Deleted!",
        text: `${doctor.name} has been deleted.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        title: "Error!",
        text: `Failed to delete ${doctor.name}: ${errorText(error)}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 text-center">
        Doctors Management
      </h1>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-blue-100 text-left text-blue-800">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="py-3 px-4 border-b border-gray-200 font-semibold text-sm"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr
                key={doctor.firebaseKey}
                className="hover:bg-gray-100 transition-colors duration-200 ease-in-out"
              >
                <td className={cellClass}>{doctor.id}</td>
                <td className={cellClass}>
                  <img
                    src={doctor.photo || FALLBACK_PHOTO}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_PHOTO;
                    }}
                  />
                </td>
                <td className={cellClass}>{doctor.name}</td>
                <td className={cellClass}>{doctor.email}</td>
                <td className={`${cellClass} capitalize`}>
                  {doctor.gender || "N/A"}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  <button
                    onClick={() => handleDelete(doctor)}
                    className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-6 text-gray-500 text-lg"
                >
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
