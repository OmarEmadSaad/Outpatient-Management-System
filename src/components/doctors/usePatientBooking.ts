"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import { ROLES } from "@/lib/shared/roles";

export default function usePatientBooking(deniedMessage: string) {
  const router = useRouter();
  const { user } = useAuth();

  return (doctorId: string) => {
    if (!user) {
      toast.error("No user role found. Please sign in as a patient.");
      return;
    }
    if (user.role !== ROLES.patient) {
      toast.error(deniedMessage);
      toast.warn("Please sign up as a patient.");
      return;
    }
    router.push(`/doctors/${doctorId}`);
  };
}
