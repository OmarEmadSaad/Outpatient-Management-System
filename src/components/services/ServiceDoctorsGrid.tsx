"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import usePatientBooking from "@/components/doctors/usePatientBooking";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import { ROLES } from "@/lib/shared/roles";
import { Button, Card, CardBody } from "@material-tailwind/react";
import type { PublicDoctor } from "@/types/domain";

export default function ServiceDoctorsGrid({
  doctors,
}: {
  doctors: PublicDoctor[];
}) {
  const { user } = useAuth();
  const handleBooking = usePatientBooking(
    "Sorry, booking is only available for patients."
  );
  const visibleDoctors =
    user?.role === ROLES.doctor
      ? doctors.filter((doctor) => doctor.id !== user.recordId)
      : doctors;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleDoctors.length > 0 ? (
        visibleDoctors.map((doctor) => (
          <Card
            key={doctor.key}
            className="w-full max-w-[384px] shadow-sm mx-auto"
          >
            <figure className="px-10 pt-10">
              <img
                src={doctor.photo || DEFAULT_AVATAR_URL}
                alt={doctor.name}
                loading="lazy"
                className="rounded-xl w-full h-[200px] object-cover"
              />
            </figure>
            <CardBody className="flex flex-col items-center gap-2 p-6 text-center text-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-semibold text-headingColor">
                {doctor.name}
              </h2>
              <p className="text-textColor">{doctor.specialization}</p>
              <div className="flex flex-wrap items-start gap-2 pt-2">
                <Button
                  color="primary"
                  onClick={() => handleBooking(doctor.id)}
                >
                  Book Now
                </Button>
              </div>
            </CardBody>
          </Card>
        ))
      ) : (
        <p className="text-center text-textColor col-span-full">
          No doctors found for this service.
        </p>
      )}
    </div>
  );
}
