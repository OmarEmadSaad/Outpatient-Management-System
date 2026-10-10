"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction } from "@/lib/client/alerts";
import UserRow from "./UserRow";
import type { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";
import type { AdminUserView } from "@/types/domain";
import type { OkResponse } from "@/types/api";

interface PatientsTableProps {
  initialPatients: AdminUserView[];
  initialAdmins: AdminUserView[];
}

const HEADERS = ["ID", "Photo", "Name", "Email", "Gender", "Role", "Actions"];

const confirmOptions = (
  title: string,
  text: string,
  icon: SweetAlertIcon,
  confirmButtonText: string
): SweetAlertOptions => ({
  title,
  text,
  icon,
  confirmButtonColor: "#3085d6",
  cancelButtonColor: "#d33",
  confirmButtonText,
  cancelButtonText: "Cancel",
  allowOutsideClick: false,
  allowEscapeKey: false,
});

export default function PatientsTable({
  initialPatients,
  initialAdmins,
}: PatientsTableProps) {
  const [users, setUsers] = useState(initialPatients);
  const [admins, setAdmins] = useState(initialAdmins);

  const changeRole = async (
    target: AdminUserView,
    role: "admin" | "patient"
  ) => {
    await apiRequest<OkResponse>(`/api/admin/users/${target.id}`, {
      method: "PATCH",
      body: { role },
    });
    const updated = { ...target, role };
    if (role === "admin") {
      setAdmins((current) => [...current, updated]);
      setUsers((current) => current.filter((user) => user.id !== target.id));
    } else {
      setUsers((current) => [...current, updated]);
      setAdmins((current) => current.filter((admin) => admin.id !== target.id));
    }
  };

  const handleMakeAdmin = async (user: AdminUserView) => {
    const confirmed = await confirmAction(
      confirmOptions(
        "Confirm Promotion",
        `Are you sure you want to promote ${user.name} to admin?`,
        "question",
        "Yes, promote!"
      )
    );
    if (!confirmed) return;
    try {
      await changeRole(user, "admin");
      toast.success(`${user.name} has been promoted to admin`);
    } catch (error) {
      toast.error("Failed to promote user: " + errorText(error));
    }
  };

  const handleRemoveAdmin = async (admin: AdminUserView) => {
    const confirmed = await confirmAction(
      confirmOptions(
        "Confirm Demotion",
        `Are you sure you want to remove ${admin.name} from admins?`,
        "warning",
        "Yes, demote!"
      )
    );
    if (!confirmed) return;
    try {
      await changeRole(admin, "patient");
      toast.success(`${admin.name} has been demoted to patient`);
    } catch (error) {
      toast.error("Failed to remove admin: " + errorText(error));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-500">
        All Patients & Admins
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-headingColor">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="py-3 px-4 text-left text-sm font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && admins.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 px-4 text-center text-textColor"
                >
                  No users available.
                </td>
              </tr>
            ) : (
              <>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    roleLabel="Patient"
                    actionLabel="Make Admin"
                    actionClass="text-white bg-blue-600 px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 mr-2"
                    onAction={handleMakeAdmin}
                  />
                ))}
                {admins.map((admin) => (
                  <UserRow
                    key={admin.id}
                    user={admin}
                    roleLabel="Admin"
                    actionLabel="Remove Admin"
                    actionClass="text-white bg-red-600 px-3 py-1.5 rounded-md text-sm hover:bg-red-700"
                    onAction={handleRemoveAdmin}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
