"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorText } from "@/lib/client/api";
import uploadImageToCloudinary, {
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/client/cloudinary";
import { Button } from "@material-tailwind/react";
import type { ProfileView } from "@/types/domain";
import type { ChangedResponse } from "@/types/api";

type PatientProfileFormData = ProfileView & { password?: string };

interface PatientProfileFormProps {
  profile: ProfileView;
  onSaved?: (profile: PatientProfileFormData) => void;
}

const inputClass =
  "w-full pr-4 px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md cursor-pointer";

const GENDER_OPTIONS: string[] = ["Male", "Female"];

const genderOptions = (current: string): string[] =>
  current && !GENDER_OPTIONS.includes(current)
    ? [current, ...GENDER_OPTIONS]
    : GENDER_OPTIONS;

export default function PatientProfileForm({
  profile,
  onSaved,
}: PatientProfileFormProps) {
  const { refresh } = useAuth();
  const [formData, setFormData] = useState<PatientProfileFormData>({
    ...profile,
    password: "",
  });
  const [previewURL, setPreviewURL] = useState(profile.photo || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    setLoading(true);
    setPreviewURL(URL.createObjectURL(file));
    setSelectedFile(file);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setFormData((current) => ({ ...current, photo: imageUrl }));
      setPreviewURL(imageUrl);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo: " + errorText(error));
      setPreviewURL(formData.photo || "");
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { changed } = await apiRequest<ChangedResponse>("/api/profile", {
        method: "PATCH",
        body: {
          name: formData.name,
          password: formData.password,
          photo: formData.photo,
          gender: formData.gender,
          bloodType: formData.bloodType,
          phoneNumber: formData.phoneNumber,
        },
      });
      if (!changed) {
        toast.info("No changes detected in your profile");
        return;
      }
      toast.success("Profile updated successfully!");
      setFormData((current) => ({ ...current, password: "" }));
      onSaved?.({ ...formData, password: undefined });
      refresh();
    } catch (error) {
      toast.error("Failed to update profile: " + errorText(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      <form onSubmit={submitHandler}>
        <div className="mb-5">
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            aria-label="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={inputClass}
          />
        </div>

        <div className="mb-5">
          <input
            name="email"
            type="email"
            placeholder="Enter your Email"
            aria-label="Email"
            value={formData.email}
            readOnly
            className={inputClass.replace(
              "cursor-pointer",
              "cursor-not-allowed"
            )}
          />
        </div>

        <div className="mb-5 relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            aria-label="New Password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleInputChange}
            className={inputClass.replace("pr-4", "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[20px] text-headingColor"
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        </div>

        <div className="mb-5">
          <input
            name="phoneNumber"
            type="tel"
            placeholder="Phone Number"
            aria-label="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div className="mb-5">
          <input
            name="bloodType"
            type="text"
            placeholder="Blood Type"
            aria-label="Blood Type"
            value={formData.bloodType}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div className="mb-5 flex justify-between">
          <label className="text-headingColor font-bold text-[16px] leading-7">
            Gender:
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="text-headingColor text-[15px] font-semibold leading-7 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor"
            >
              <option value="">Select</option>
              {genderOptions(formData.gender).map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 flex items-center gap-3">
          {(selectedFile || formData.photo) && previewURL && (
            <figure className="w-[60px] h-[60px] rounded-full border-2 border-primaryColor flex items-center justify-center">
              <img
                src={previewURL}
                className="rounded-full w-[150%] h-[100%]"
                alt="Avatar"
              />
            </figure>
          )}

          <div className="relative h-[50px] w-[130px]">
            <input
              type="file"
              name="photo"
              id="customFile"
              onChange={handleFileInputChange}
              accept=".jpg,.png"
              className="hidden"
            />
            <label
              htmlFor="customFile"
              className="absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer"
            >
              {loading ? (
                <Spinner size={25} color="#0066ff" />
              ) : selectedFile ? (
                "Change Photo"
              ) : (
                "Upload Photo"
              )}
            </label>
          </div>
        </div>

        <div className="mt-7">
          <Button
            color="primary"
            className="w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? <Spinner size={25} color="#ffffff" /> : "Update"}
          </Button>
        </div>
      </form>
    </div>
  );
}
