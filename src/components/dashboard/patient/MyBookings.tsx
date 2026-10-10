import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import { formatExpectedTime } from "@/lib/shared/timeSlots";
import type { ReactNode } from "react";
import type { AppointmentView } from "@/types/domain";

interface DetailProps {
  label: string;
  children: ReactNode;
}

interface MyBookingsProps {
  bookings: AppointmentView[];
}

const Detail = ({ label, children }: DetailProps) => (
  <p className="text-textColor">
    <span className="font-semibold">{label}:</span> {children}
  </p>
);

export default function MyBookings({ bookings }: MyBookingsProps) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {bookings.length > 0 ? (
          bookings.map((appointment) => (
            <div
              key={appointment.key}
              className="p-4 border border-gray-200 rounded-md shadow-sm"
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={appointment.doctor.photo || DEFAULT_AVATAR_URL}
                  alt="Doctor"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-semibold text-headingColor">
                    Doctor: {appointment.doctor.name || "Unknown Doctor"}
                  </p>
                  <p className="text-textColor">
                    Patient: {appointment.user.name || "Unknown User"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Detail label="Ticket Price">
                  {appointment.ticketPrice || "N/A"} BDT
                </Detail>
                <Detail label="Time Slot">
                  {appointment.timeSlot || "Not specified"}
                </Detail>
                <Detail label="Queue Number">
                  {appointment.queueNumber || "Not assigned"}
                </Detail>
                <Detail label="Expected Visit Time">
                  {formatExpectedTime(appointment.expectedTime)}
                </Detail>
              </div>
            </div>
          ))
        ) : (
          <h2 className="mt-5 text-[20px] leading-7 text-center font-semibold text-primaryColor">
            You haven&apos;t booked any active appointments yet!
          </h2>
        )}
      </div>
    </div>
  );
}
