"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, errorText } from "@/lib/client/api";
import { showAlert } from "@/lib/client/alerts";
import uploadImageToCloudinary from "@/lib/client/cloudinary";
import type { PublicService } from "@/types/domain";
import type { OkResponse, ServiceResponse } from "@/types/api";

interface ServiceFormProps {
  service?: PublicService;
}

const DEFAULT_PREVIEW = "https://webemps.com/images/default-image.jpg";
const fieldClass =
  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-right";
const labelClass = "block text-gray-700 font-semibold mb-2 text-right";

const errorAlert = (text: string) =>
  showAlert({
    title: "Error!",
    text,
    icon: "error",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "OK",
  });

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const isEditing = Boolean(service);
  const [formData, setFormData] = useState({
    name: service?.name || "",
    desc: service?.desc || "",
    image: service?.image || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, "service");
      setFormData((current) => ({ ...current, image: imageUrl }));
    } catch (error) {
      errorAlert(`Failed to upload image to Cloudinary: ${errorText(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const missingFields = () =>
    [
      !formData.name.trim() && "Name",
      !formData.desc.trim() && "Description",
      !formData.image && "Image",
    ].filter((field): field is string => Boolean(field));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading) {
      errorAlert("Image is still uploading. Please wait.");
      return;
    }
    const missing = missingFields();
    if (missing.length > 0) {
      errorAlert(`Please fill in all fields. Missing: ${missing.join(", ")}`);
      return;
    }

    try {
      await apiRequest<ServiceResponse | OkResponse>(
        service
          ? `/api/admin/services/${service.key}`
          : "/api/admin/services",
        {
          method: isEditing ? "PATCH" : "POST",
          body: formData,
        }
      );
      showAlert({
        title: "Saved!",
        text: isEditing
          ? "Service updated successfully."
          : "Service added successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push("/services");
      router.refresh();
    } catch (error) {
      errorAlert(
        `Failed to ${isEditing ? "update" : "add"} service: ${errorText(error)}`
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mb-[8em]"
      >
        <h1 className="text-2xl font-bold mb-4 text-blue-400">
          {service ? `Edit Service: ${service.name}` : "Add New Service"}
        </h1>
        <div className="mb-4">
          <label htmlFor="service-name" className={labelClass}>
            Service Name
          </label>
          <input
            id="service-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={fieldClass}
            placeholder="Enter service name"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="service-desc" className={labelClass}>
            Description
          </label>
          <textarea
            id="service-desc"
            name="desc"
            value={formData.desc}
            onChange={handleInputChange}
            className={fieldClass}
            placeholder="Enter service description"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <p className={labelClass}>Image</p>
          <div className="flex items-center space-x-4">
            <img
              src={formData.image || DEFAULT_PREVIEW}
              alt={isEditing ? "Image preview" : "Preview"}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="relative h-[50px] w-[130px]">
              <input
                type="file"
                name="image"
                id="customFile"
                onChange={handleImageChange}
                accept=".jpg, .png"
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="customFile"
                className={`absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={uploading}
            className={`text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded hover:cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isEditing ? "Save Changes" : "Save"}
          </button>
          <button
            type="button"
            onClick={() =>
              isEditing ? router.back() : router.push("/all-services")
            }
            className="text-white bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded hover:cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
