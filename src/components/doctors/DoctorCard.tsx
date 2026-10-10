import Image from "next/image";
import ArrowLink from "@/components/ui/ArrowLink";
import starIcon from "@/assets/images/Star.png";
import type { PublicDoctor } from "@/types/domain";

export default function DoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const { name, avgRating, totalRating, photo, specialization, experiences } =
    doctor;

  return (
    <div className="p-3 lg:p-5">
      <div>
        <img
          src={photo}
          className="w-full h-[40vh]"
          alt={name}
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="mt-3 lg:mt-5 font-[700] lg:text-[26px] leading-[30px] text-[18px] text-headingColor">
        {name}
      </h3>
      <div className="mt-2 lg:mt-4 flex items-center justify-between">
        <span
          className="bg-[#CCF0F3] text-irisBlueColor py-1 px-2 lg:py-2 lg:px-6 text-[12px] lg:text-[16px] 
        leading-4 lg:leading-7 font-semibold rounded"
        >
          {specialization}
        </span>
        <div className="flex justify-center gap-[6px]">
          <span className="flex items-center gap-[6px] text-[14px] leading-6 lg:text-[16px] lg:leading-7 text-headingColor font-semibold">
            <Image src={starIcon} alt="" />{" "}
            {avgRating ? avgRating.toFixed(1) : 0}
          </span>
          <span className="text-[14px] leading-6 lg:text-[16px] lg:leading-7 text-textColor font-[400]">
            {totalRating}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-[18px] lg:mt-5">
        <div>
          <p className="font-[400] text-[14px] leading-6 text-textColor">
            At {experiences[0]?.hospital}
          </p>
        </div>
        <ArrowLink href={`/doctors/${doctor.id}`} label={`View ${name}`} />
      </div>
    </div>
  );
}
