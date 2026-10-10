"use client";

import { useState } from "react";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import Image from "next/image";
import DoctorAbout from "@/components/doctors/details/DoctorAbout";
import starIcon from "@/assets/images/Star.png";
import DoctorAppointmentsTable from "./DoctorAppointmentsTable";
import DoctorProfileForm, {
  type DoctorProfileSource,
} from "./DoctorProfileForm";
import PendingApprovalNotice from "./PendingApprovalNotice";
import Tads, { type DoctorTab } from "./Tads";
import type { AppointmentView, DoctorDashboardData } from "@/types/domain";

interface DoctorDashboardViewProps {
  doctor: DoctorDashboardData;
  appointments: AppointmentView[];
  serviceNames: string[];
}

export default function DoctorDashboardView({
  doctor,
  appointments,
  serviceNames,
}: DoctorDashboardViewProps) {
  const [tab, setTab] = useState<DoctorTab>("overview");
  const [doctorData, setDoctorData] = useState<DoctorProfileSource>(doctor);

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid lg:grid-cols-3 gap-[30px] lg:gap-[50px]">
          <div className="lg:col-span-1">
            <Tads tab={tab} setTab={setTab} />
          </div>
          <div className="lg:col-span-2">
            {doctorData.isApproved === "pending" && <PendingApprovalNotice />}
            <div className="mt-5">
              {tab === "overview" && (
                <div>
                  <div className="mb-10 gap-4 flex flex-col sm:flex-row items-center">
                    <figure className="w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-solid border-primaryColor">
                      <img
                        src={doctorData.photo || DEFAULT_AVATAR_URL}
                        className="w-full h-full object-cover"
                        alt="Doctor"
                      />
                    </figure>
                    <div className="text-center sm:text-left">
                      <span className="bg-[#CCF0F3] text-irisBlueColor px-4 py-1 rounded text-sm lg:text-base font-semibold">
                        {doctorData.specialization || "N/A"}
                      </span>
                      <h1 className="text-2xl lg:text-3xl font-bold text-headingColor mt-3">
                        {doctorData.name || "Doctor Name"}
                      </h1>
                      <div className="flex items-center gap-[6px] justify-center sm:justify-start mt-2">
                        <span className="flex items-center gap-[6px] text-headingColor text-sm lg:text-base font-semibold">
                          <Image
                            src={starIcon}
                            alt="Star"
                            className="w-4 h-4"
                          />
                          {doctorData.averageRating || "0.0"}
                        </span>
                        <span className="text-sm lg:text-base font-semibold text-textColor">
                          ({doctorData.totalRating || 0})
                        </span>
                      </div>
                      <p className="text__para font-[15px] leading-6 max-w-[400px] mt-2 text-center sm:text-left">
                        {doctorData.bio || "No bio available."}
                      </p>
                    </div>
                  </div>
                  <DoctorAbout
                    name={doctorData.name}
                    about={doctorData.about}
                    qualifications={doctorData.qualifications}
                    experiences={doctorData.experiences}
                  />
                </div>
              )}
              {tab === "appointments" && (
                <DoctorAppointmentsTable appointments={appointments} />
              )}
              {tab === "settings" && (
                <DoctorProfileForm
                  doctor={doctorData}
                  serviceNames={serviceNames}
                  onSaved={(saved) =>
                    setDoctorData((current) => ({ ...current, ...saved }))
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
