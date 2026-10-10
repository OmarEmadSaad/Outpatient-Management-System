"use client";

import { Card, CardBody } from "@material-tailwind/react";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { filterDoctorsForListing } from "@/lib/shared/ratings";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import { ROLES } from "@/lib/shared/roles";
import StarRating from "./StarRating";
import usePatientBooking from "./usePatientBooking";
import type { PublicDoctor } from "@/types/domain";

export default function DoctorsBrowser({
  doctors,
}: {
  doctors: PublicDoctor[];
}) {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const handleBooking = usePatientBooking(
    "Sorry, access denied. Booking is available only for patients 😔."
  );
  const excludedDoctorId = user?.role === ROLES.doctor ? user.recordId : null;

  const filteredDoctors = useMemo(
    () => filterDoctorsForListing(doctors, query, excludedDoctorId),
    [doctors, query, excludedDoctorId]
  );

  return (
    <>
      <section className="bg-[#fff9ea]">
        <div className="text-center container">
          <h1 className="heading">Find A Doctor</h1>
          <div className="max-w-[570px] mt-[30px] mx-auto bg-[#0066ff2c] rounded-md flex items-center justify-between">
            <input
              type="search"
              placeholder="Search by specialization (e.g., Surgeon, Neurologist)"
              aria-label="Search by specialization"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="py-4 pl-4 pr-2 bg-transparent w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor placeholder:text-textColor"
            />
            <button
              className="bg-primaryColor text-white font-[600] h-[44px] px-6 rounded-[50px]"
              onClick={() => setQuery(query.trim())}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-[30px] justify-items-center">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <Card key={doctor.key} className="w-96 shadow-sm">
                  <figure className="px-10 pt-10">
                    <img
                      src={doctor.photo || DEFAULT_AVATAR_URL}
                      alt={doctor.name}
                      loading="lazy"
                      decoding="async"
                      className="rounded-xl w-full h-[40vh] object-cover"
                    />
                  </figure>
                  <CardBody className="flex flex-col items-center gap-2 p-6 text-center text-sm">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      {doctor.name}
                    </h2>
                    <p>{doctor.specialization}</p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={doctor.avgRating} />
                      <span className="text-[14px] text-textColor">
                        ({doctor.totalRating || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 pt-2">
                      <button
                        className="bg-primaryColor text-white font-[600] h-[44px] px-6 rounded-[50px]"
                        onClick={() => handleBooking(doctor.id)}
                      >
                        Book Now
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <p className="text-center text-textColor">
                {query
                  ? "No doctors found for this specialization."
                  : "No doctors found with rating 3.5 or higher."}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
