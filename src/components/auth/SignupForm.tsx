"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorStatus, errorText } from "@/lib/client/api";
import uploadImageToCloudinary, {
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/client/cloudinary";
import { ROLES } from "@/lib/shared/roles";
import { validateRegistration } from "@/lib/shared/validation";
import {
  DoctorSignupFields,
  RoleAndGenderFields,
  SignupInput,
  SignupPhotoField,
  type SignupErrors,
  type SignupFormData,
} from "./SignupFields";
import type { RegisterResponse } from "@/types/api";
import { Button } from "@material-tailwind/react";

const initialForm: SignupFormData = {
  name: "",
  email: "",
  password: "",
  photo: "",
  gender: "",
  role: "",
  specialization: "",
  phone: "",
  ticketPrice: 0,
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export default function SignupForm() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.admin;
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [previewURL, setPreviewURL] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFormData((current) => ({ ...current, photo: "" }));
      setPreviewURL("");
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setPreviewURL(imageUrl);
      setFormData((current) => ({ ...current, photo: imageUrl }));
      setErrors((current) => ({ ...current, photo: "" }));
      toast.success("Photo uploaded successfully");
    } catch {
      toast.error("Failed to upload image. Please try again.");
      setFormData((current) => ({ ...current, photo: "" }));
      setPreviewURL("");
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors: SignupErrors = validateRegistration(formData);
    if (!formData.role) validationErrors.role = "Please select a role.";
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const { role } = await apiRequest<RegisterResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: formData,
        }
      );
      toast.success(`${capitalize(role)} registered successfully!`);
      router.push(isAdmin ? "/admin/profile/me" : "/login");
    } catch (error) {
      if (errorStatus(error) === 409) {
        setErrors((current) => ({ ...current, email: errorText(error) }));
      }
      toast.error(errorText(error, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <SignupInput
        name="name"
        placeholder="Full Name"
        autoComplete="name"
        value={formData.name}
        onChange={handleInputChange}
        error={errors.name}
      />
      <SignupInput
        name="email"
        type="email"
        placeholder="Enter your Email"
        autoComplete="email"
        className="mb-5 mt-4"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
      />
      <SignupInput
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        className="mb-5 mt-4"
        value={formData.password}
        onChange={handleInputChange}
        error={errors.password}
      />

      <RoleAndGenderFields
        formData={formData}
        errors={errors}
        onChange={handleInputChange}
        isAdmin={isAdmin}
      />

      {formData.role === ROLES.doctor && (
        <DoctorSignupFields
          formData={formData}
          errors={errors}
          onChange={handleInputChange}
        />
      )}

      <SignupPhotoField
        previewURL={previewURL}
        loading={loading}
        onChange={handleFileInputChange}
      />

      <div className="mt-7">
        <Button
          color="primary"
          className="w-full"
          disabled={loading}
          type="submit"
        >
          {loading ? <Spinner size={35} color="#ffffff" /> : "Register"}
        </Button>
      </div>

      <p className="mt-3">
        Already have an account?
        <Link href="/login" className="text-primaryColor font-medium ml-1">
          Login
        </Link>
      </p>
    </form>
  );
}
