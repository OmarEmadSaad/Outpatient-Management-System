"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { apiRequest, errorText } from "@/lib/client/api";
import { confirmAction, showAlert } from "@/lib/client/alerts";
import MyBookings from "./MyBookings";
import PatientProfileForm from "./PatientProfileForm";
import { Button } from "@material-tailwind/react";
import type { AppointmentView, ProfileView } from "@/types/domain";
import type { OkResponse } from "@/types/api";

interface MyAccountViewProps {
  profile: ProfileView;
  bookings: AppointmentView[];
}

const DEFAULT_AVATAR =
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of_social_media_user_vector.jpg";

const TABS = [
  { value: "bookings", label: "My Bookings" },
  { value: "settings", label: "Profile Settings" },
];

export default function MyAccountView({
  profile,
  bookings,
}: MyAccountViewProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [tab, setTab] = useState("bookings");
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = await confirmAction({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await apiRequest<OkResponse>("/api/profile", { method: "DELETE" });
      showAlert({
        title: "Deleted!",
        text: "Your account has been deleted.",
        icon: "success",
      });
      setUser(null);
      router.push("/login");
    } catch (error) {
      showAlert({ title: "Error!", text: errorText(error), icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="pb-[50px] px-[30px] rounded-md">
            <div className="flex items-center justify-center">
              <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor mt-1">
                <img
                  src={currentProfile.photo || DEFAULT_AVATAR}
                  className="w-full h-full rounded-full"
                  alt="Avatar"
                />
              </figure>
            </div>

            <div className="text-center mt-4">
              <h1 className="text-[18px] leading-[30px] text-headingColor font-bold">
                {currentProfile.name || "N/A"}
              </h1>
              <p className="text-textColor text-[15px] leading-6 font-medium">
                {currentProfile.email || "N/A"}
              </p>
              <p className="text-textColor text-[15px] leading-6 font-medium">
                Blood Type:
                <span className="ml-2 text-headingColor text-[22px] leading-8">
                  {currentProfile.bloodType || "N/A"}
                </span>
              </p>
            </div>
            <div className="mt-[50px] md:mt-[100px]">
              <Button
                color="error"
                className="mt-4 w-full"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size={25} color="#ffffff" />
                ) : (
                  "Delete Account"
                )}
              </Button>
            </div>
          </div>
          <div className="md:col-span-2 md:px-[30px]">
            <div>
              {TABS.map(({ value, label }) => (
                <Button
                  key={value}
                  color="primary"
                  variant={tab === value ? "solid" : "outline"}
                  aria-pressed={tab === value}
                  onClick={() => setTab(value)}
                  className="mr-5 mt-2 px-5 text-[16px] leading-7"
                >
                  {label}
                </Button>
              ))}
            </div>
            {tab === "bookings" && <MyBookings bookings={bookings} />}
            {tab === "settings" && (
              <PatientProfileForm
                profile={currentProfile}
                onSaved={setCurrentProfile}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
