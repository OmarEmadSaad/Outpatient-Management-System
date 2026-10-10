"use client";

import { useState, type ChangeEventHandler } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const narrowInput = "form__input w-full sm:w-1/2 max-w-md";

interface SelectOption {
  value: string;
  label: string;
}

export interface DoctorBasicFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  bio: string;
  gender: string;
  specialization: string;
  ticketPrice: string | number;
}

interface DoctorBasicFieldsProps {
  formData: DoctorBasicFormData;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  specializations: string[];
}

const GENDER_OPTIONS: SelectOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const withLegacyOption = (
  options: SelectOption[],
  value: string
): SelectOption[] =>
  !value || options.some((option) => option.value === value)
    ? options
    : [{ value, label: value }, ...options];

export default function DoctorBasicFields({
  formData,
  onChange,
  specializations,
}: DoctorBasicFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="mb-5">
        <p className="form__label">Name*</p>
        <input
          type="text"
          name="name"
          aria-label="Name"
          value={formData.name}
          onChange={onChange}
          placeholder="Full Name"
          className={narrowInput}
          required
        />
      </div>

      <div className="mb-5 hover:cursor-no-drop">
        <p className="form__label">Email*</p>
        <input
          type="email"
          name="email"
          aria-label="Email"
          value={formData.email}
          placeholder="Your Email"
          className={`${narrowInput} hover:cursor-no-drop`}
          readOnly
          disabled
        />
      </div>

      <div className="mb-5 relative">
        <p className="form__label">Password</p>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          aria-label="Update Password"
          autoComplete="new-password"
          value={formData.password}
          onChange={onChange}
          placeholder="Update Password"
          className={`${narrowInput} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          className="absolute right-3 top-[3.9em] sm:left-[23em] sm:top-[3.5em] lg:right-[14.3em] lg:top-[3.8em] transform -translate-y-1/2 text-base sm:text-lg text-headingColor"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </button>
      </div>

      <div className="mb-5">
        <p className="form__label">Phone</p>
        <input
          type="tel"
          name="phone"
          aria-label="Phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Your Phone"
          className={narrowInput}
        />
      </div>

      <div className="mb-5">
        <p className="form__label">Bio</p>
        <input
          type="text"
          name="bio"
          aria-label="Bio"
          value={formData.bio}
          onChange={onChange}
          placeholder="Bio"
          className={narrowInput}
          maxLength={100}
        />
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="form__label">Gender*</p>
            <select
              name="gender"
              aria-label="Gender"
              value={formData.gender}
              onChange={onChange}
              className="form__input py-2.5 w-full"
              required
            >
              <option value="">Select</option>
              {withLegacyOption(GENDER_OPTIONS, formData.gender).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <p className="form__label">Specialization*</p>
            <select
              name="specialization"
              aria-label="Specialization"
              value={formData.specialization}
              onChange={onChange}
              className="form__input py-2.5 w-full"
              required
            >
              <option value="">Select</option>
              {specializations.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="form__label">Ticket Price</p>
            <input
              type="number"
              placeholder="100"
              name="ticketPrice"
              aria-label="Ticket Price"
              value={formData.ticketPrice}
              onChange={onChange}
              className="form__input py-2.5 w-full"
              min="0"
            />
          </div>
        </div>
      </div>
    </>
  );
}
