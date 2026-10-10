import { listDoctors } from "@/lib/server/data/publicData";
import DoctorCard from "./DoctorCard";

export default async function DoctorList() {
  const doctors = await listDoctors();

  if (doctors.length === 0) {
    return <p className="text-center text-textColor mt-5">No doctors found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px] justify-items-center">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.key} doctor={doctor} />
      ))}
    </div>
  );
}
