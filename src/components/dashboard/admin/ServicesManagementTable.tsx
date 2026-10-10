"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction, showAlert } from "@/lib/client/alerts";
import type { PublicService } from "@/types/domain";
import type { OkResponse } from "@/types/api";

interface ServicesManagementTableProps {
  initialServices: PublicService[];
}

const FALLBACK_IMAGE = "https://webemps.com/images/default-image.jpg";

const truncate = (text: string) =>
  (text || "").substring(0, 20) + ((text || "").length > 20 ? "..." : "");

export default function ServicesManagementTable({
  initialServices,
}: ServicesManagementTableProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);

  const handleDelete = async (service: PublicService) => {
    const confirmed = await confirmAction({
      title: "Delete Confirmation",
      text: `Are you sure you want to delete the service "${service.name}"?`,
      icon: "warning",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    if (!confirmed) return;

    try {
      await apiRequest<OkResponse>(`/api/admin/services/${service.key}`, {
        method: "DELETE",
      });
      setServices((current) =>
        current.filter((item) => item.key !== service.key)
      );
      showAlert({
        title: "Deleted!",
        text: `Service "${service.name}" has been deleted successfully.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        title: "Error!",
        text: `Failed to delete service "${service.name}": ${errorText(error)}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-400">
        Services Management
      </h1>
      <div className="mt-2 mb-2 text-center">
        <button
          onClick={() => router.push("/services/add")}
          className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
        >
          Add Services
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b text-center">Image</th>
              <th className="py-2 px-4 border-b">Service Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No services available.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.key} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-right">
                    {service.id}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <img
                      src={service.image || FALLBACK_IMAGE}
                      alt={service.name}
                      className="w-12 h-12 rounded-full object-cover mx-auto"
                    />
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {service.name}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {truncate(service.desc)}
                  </td>
                  <td className="py-2 px-4 border-b text-right gap-[2em]">
                    <button
                      onClick={() => handleDelete(service)}
                      className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/services/${encodeURIComponent(service.id)}`
                        )
                      }
                      className="text-white mt-2 bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
