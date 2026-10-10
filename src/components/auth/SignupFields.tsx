"use client";

import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  photo: string;
  gender: string;
  role: string;
  specialization: string;
  phone: string;
  ticketPrice: string | number;
}

export type SignupErrors = Partial<Record<string, string>>;

type FieldChangeHandler = ChangeEventHandler<
  HTMLInputElement | HTMLSelectElement
>;

export const signupInputClass =
  "w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md";

interface FieldErrorProps {
  message: string | undefined;
}

export function FieldError({ message }: FieldErrorProps) {
  return message ? (
    <p className="text-red-500 text-sm mt-1">{message}</p>
  ) : null;
}

interface SignupInputProps {
  name: string;
  type?: HTMLInputTypeAttribute;
  placeholder: string;
  value: string | number;
  onChange: FieldChangeHandler;
  error: string | undefined;
  className?: string;
  autoComplete?: string;
}

export function SignupInput({
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  className = "mb-5",
  autoComplete,
}: SignupInputProps) {
  return (
    <div className={className}>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={signupInputClass}
      />
      <FieldError message={error} />
    </div>
  );
}

interface RoleAndGenderFieldsProps {
  formData: SignupFormData;
  errors: SignupErrors;
  onChange: FieldChangeHandler;
  isAdmin: boolean;
}

export function RoleAndGenderFields({
  formData,
  errors,
  onChange,
  isAdmin,
}: RoleAndGenderFieldsProps) {
  return (
    <div className="mb-5 flex justify-between">
      <label className="text-headingColor font-bold text-[16px] leading-7">
        Are you a:
        <select
          name="role"
          value={formData.role}
          onChange={onChange}
          className="text-headingColor text-[15px] font-semibold leading-7 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor"
        >
          <option value="">Select Role</option>
          {!isAdmin && <option value="patient">Patient</option>}
          {isAdmin && <option value="doctor">Doctor</option>}
          {isAdmin && <option value="admin">Admin</option>}
        </select>
      </label>
      <FieldError message={errors.role} />

      <label className="text-headingColor font-bold text-[16px] leading-7">
        Gender:
        <select
          name="gender"
          value={formData.gender}
          onChange={onChange}
          className="text-headingColor text-[15px] font-semibold leading-7 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor"
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>
      <FieldError message={errors.gender} />
    </div>
  );
}

interface DoctorSignupFieldsProps {
  formData: SignupFormData;
  errors: SignupErrors;
  onChange: FieldChangeHandler;
}

export function DoctorSignupFields({
  formData,
  errors,
  onChange,
}: DoctorSignupFieldsProps) {
  return (
    <>
      <SignupInput
        name="phone"
        placeholder="Enter your phone number"
        value={formData.phone}
        onChange={onChange}
        error={errors.phone}
      />
      <SignupInput
        name="specialization"
        placeholder="Enter your specialization"
        value={formData.specialization}
        onChange={onChange}
        error={errors.specialization}
      />
      <SignupInput
        name="ticketPrice"
        type="number"
        placeholder="Enter ticket price"
        value={formData.ticketPrice}
        onChange={onChange}
        error={errors.ticketPrice}
      />
    </>
  );
}

interface SignupPhotoFieldProps {
  previewURL: string;
  loading: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export function SignupPhotoField({
  previewURL,
  loading,
  onChange,
}: SignupPhotoFieldProps) {
  return (
    <div className="mb-5 gap-3 flex items-center">
      {previewURL && (
        <figure className="w-[60px] h-[60px] rounded-full border-2 border-primaryColor flex items-center justify-center">
          <img src={previewURL} className="rounded-full w-full" alt="Avatar" />
        </figure>
      )}

      <div className="relative h-[50px] w-[130px]">
        <input
          type="file"
          name="photo"
          id="customFile"
          onChange={onChange}
          accept=".jpg, .png, image/jpeg, image/png"
          className="hidden"
          disabled={loading}
        />
        <label
          htmlFor="customFile"
          className={`absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Uploading..." : "Upload Photo"}
        </label>
      </div>
    </div>
  );
}
