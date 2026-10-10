"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorText } from "@/lib/client/api";
import uploadImageToCloudinary, {
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/client/cloudinary";
import DoctorBasicFields, {
  type DoctorBasicFormData,
} from "./DoctorBasicFields";
import { DatedListEditor, TimeSlotsEditor } from "./ProfileListEditors";
import type { DoctorDashboardData } from "@/types/domain";
import type {
  ExperienceRecord,
  QualificationRecord,
  TimeSlotRecord,
} from "@/types/firebase";
import type { ChangedResponse } from "@/types/api";

interface ListItems {
  qualifications: QualificationRecord;
  experiences: ExperienceRecord;
  timeSlots: TimeSlotRecord;
}

type ListKey = keyof ListItems;

type ListFields = { [K in ListKey]: ListItems[K][] };

interface DoctorProfileFormData extends DoctorBasicFormData, ListFields {
  photo: string | null;
  about: string;
}

export type DoctorProfileSource = Omit<DoctorDashboardData, "photo"> & {
  photo: string | null;
};

export type DoctorProfileUpdate = Omit<
  DoctorProfileFormData,
  "password" | "email" | "ticketPrice"
> & { ticketPrice: number };

interface DoctorProfileFormProps {
  doctor: DoctorProfileSource;
  serviceNames: string[];
  onSaved?: (saved: DoctorProfileUpdate) => void;
}

const EMPTY_ITEMS: ListItems = {
  qualifications: {
    startingDate: "",
    endingDate: "",
    degree: "",
    university: "",
  },
  experiences: { startingDate: "", endingDate: "", position: "", hospital: "" },
  timeSlots: { day: "", startingTime: "", endingTime: "" },
};

const withFallbackItem = <K extends ListKey>(
  items: ListItems[K][],
  key: K
): ListItems[K][] => (items?.length ? items : [{ ...EMPTY_ITEMS[key] }]);

const toFormState = (doctor: DoctorProfileSource): DoctorProfileFormData => ({
  name: doctor.name || "",
  email: doctor.email || "",
  password: "",
  phone: doctor.phone || "",
  bio: doctor.bio || "",
  gender: doctor.gender || "",
  specialization: doctor.specialization || "",
  ticketPrice: doctor.ticketPrice || 0,
  photo: doctor.photo || null,
  about: doctor.about || "",
  qualifications: withFallbackItem(doctor.qualifications, "qualifications"),
  experiences: withFallbackItem(doctor.experiences, "experiences"),
  timeSlots: withFallbackItem(doctor.timeSlots, "timeSlots"),
});

const narrowInput = "form__input w-full sm:w-1/2 max-w-md";

export default function DoctorProfileForm({
  doctor,
  serviceNames,
  onSaved,
}: DoctorProfileFormProps) {
  const [formData, setFormData] = useState(() => toFormState(doctor));
  const [previewURL, setPreviewURL] = useState(doctor.photo || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const specializations =
    serviceNames.includes(formData.specialization) || !formData.specialization
      ? serviceNames
      : [formData.specialization, ...serviceNames];

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const updateList = <K extends ListKey>(
    key: K,
    update: (items: ListItems[K][]) => ListItems[K][]
  ) =>
    setFormData((current) => {
      const lists: ListFields = current;
      return { ...current, [key]: update(lists[key]) };
    });

  const listHandlers = <K extends ListKey>(key: K) => {
    const lists: ListFields = formData;
    return {
      items: lists[key],
      onAdd: () =>
        updateList(key, (items) => [...items, { ...EMPTY_ITEMS[key] }]),
      onDelete: (index: number) =>
        updateList(key, (items) => items.filter((_, i) => i !== index)),
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        index: number
      ) => {
        const { name, value } = event.target;
        updateList(key, (items) =>
          items.map((item, i) =>
            i === index ? { ...item, [name]: value } : item
          )
        );
      },
    };
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
    setPreviewURL(URL.createObjectURL(file));
    setSelectedFile(file);
    setLoading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setFormData((current) => ({ ...current, photo: imageUrl }));
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo: " + errorText(error));
      setPreviewURL(formData.photo || "");
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.gender) {
      toast.error("Please select your gender");
      return;
    }
    if (!formData.specialization.trim()) {
      toast.error("Specialization is required");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<ChangedResponse>("/api/doctor/profile", {
        method: "PATCH",
        body: formData,
      });
      toast.success("Profile updated successfully");
      setFormData((current) => ({ ...current, password: "" }));
      const { password: _password, email: _email, ...saved } = formData;
      onSaved?.({ ...saved, ticketPrice: Number(saved.ticketPrice) || 0 });
    } catch (error) {
      toast.error(errorText(error, "Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-headingColor mb-6 leading-9 font-bold text-[18px] sm:text-[24px]">
        Profile Information for <span className="text-blue-500">doctor</span>
      </h2>

      <form onSubmit={updateProfileHandler}>
        <DoctorBasicFields
          formData={formData}
          onChange={handleInputChange}
          specializations={specializations}
        />

        <DatedListEditor
          title="Qualifications*"
          textFields={[
            { name: "degree", label: "Degree*" },
            { name: "university", label: "University*" },
          ]}
          addLabel="Add Qualification"
          deleteLabel="Delete qualification"
          {...listHandlers("qualifications")}
        />
        <DatedListEditor
          title="Experiences*"
          textFields={[
            { name: "position", label: "Position*" },
            { name: "hospital", label: "Hospital*" },
          ]}
          addLabel="Add Experience"
          deleteLabel="Delete experience"
          {...listHandlers("experiences")}
        />
        <TimeSlotsEditor {...listHandlers("timeSlots")} />

        <div className="mb-5">
          <p className="form__label">About</p>
          <textarea
            name="about"
            aria-label="About"
            rows={5}
            value={formData.about}
            onChange={handleInputChange}
            placeholder="Write about you"
            className={narrowInput}
          />
        </div>

        <div className="mb-5 flex items-center gap-3">
          {(selectedFile || formData.photo) && previewURL && (
            <figure className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-primaryColor flex items-center justify-center">
              <img
                src={previewURL}
                className="rounded-full w-full h-full object-cover"
                alt="Avatar"
              />
            </figure>
          )}
          <div className="relative w-full sm:w-32 h-10">
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
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center px-2 py-1 text-sm sm:text-base text-headingColor bg-[#0066ff46] font-semibold rounded-lg cursor-pointer"
            >
              {loading ? (
                <Spinner size={20} color="#0066ff" />
              ) : selectedFile ? (
                "Change Photo"
              ) : (
                "Upload Photo"
              )}
            </label>
          </div>
        </div>

        <div className="mt-7">
          <button
            disabled={loading}
            type="submit"
            className="bg-primaryColor cursor-pointer text-white text-sm sm:text-base px-4 py-2 rounded-lg hover:bg-primaryColor/90 transition disabled:opacity-50"
          >
            {loading ? <Spinner size={20} color="#ffffff" /> : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
