"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest, errorText } from "@/lib/client/api";
import { formatTimeSlotLabel, isCompleteSlot } from "@/lib/shared/timeSlots";
import { Button } from "@material-tailwind/react";
import type { BookingResponse } from "@/types/api";
import type { TimeSlotRecord } from "@/types/firebase";

export default function Sidepanel({
  doctorId,
  ticketPrice,
  timeSlots,
}: {
  doctorId: string;
  ticketPrice: number;
  timeSlots: TimeSlotRecord[];
}) {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const slotLabels = timeSlots.filter(isCompleteSlot).map(formatTimeSlotLabel);
  const isDisabled = loading || !user;

  useEffect(() => {
    if (isReady && !user) {
      toast.warn("You need to log in to book an appointment.");
    }
  }, [isReady, user]);

  const bookingHandler = async () => {
    if (!user) {
      toast.error("Please log in to book an appointment");
      router.push("/login");
      return;
    }
    if (!selectedTimeSlot) {
      toast.error("Please select a time slot.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<BookingResponse>("/api/appointments", {
        method: "POST",
        body: { doctorId, timeSlot: selectedTimeSlot },
      });
      toast.success("Appointment booked successfully!");
      router.push("/user/profile/me");
    } catch (error) {
      toast.error(errorText(error, "Failed to book appointment"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-panelShadow p-3 lg:p-5 rounded-md">
      <div className="flex justify-between items-center">
        <p className="text__para mt-0 font-semibold">Ticket Price</p>
        <span className="text-[16px] leading-7 lg:text-[22px] lg:leading-8 text-headingColor font-bold">
          {ticketPrice ? `${ticketPrice} BDT` : "Not specified"}
        </span>
      </div>

      <div className="mt-[30px]">
        <p className="text__para mt-0 font-semibold text-headingColor">
          Available Time Slots
        </p>
        {timeSlots.length > 0 ? (
          <div>
            <select
              value={selectedTimeSlot}
              onChange={(event) => setSelectedTimeSlot(event.target.value)}
              className="w-full p-2 border rounded-md mt-3"
              disabled={loading}
              aria-label="Available time slots"
            >
              <option value="">Choose a time slot</option>
              {slotLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-[15px] leading-6 text-textColor mt-2">
            No available time slots.
          </p>
        )}
      </div>

      <Button
        color="primary"
        className="w-full mt-[0.5em]"
        onClick={bookingHandler}
        disabled={isDisabled}
      >
        {loading ? "Booking..." : "Book Appointment"}
      </Button>
    </div>
  );
}
