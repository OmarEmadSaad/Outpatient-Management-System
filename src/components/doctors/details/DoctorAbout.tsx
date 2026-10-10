import { formatDate } from "@/lib/shared/ratings";
import type { ExperienceRecord, QualificationRecord } from "@/types/firebase";

interface DoctorAboutProps {
  name?: string;
  about?: string;
  qualifications?: QualificationRecord[];
  experiences?: ExperienceRecord[];
}

export default function DoctorAbout({
  name,
  about,
  qualifications,
  experiences,
}: DoctorAboutProps) {
  return (
    <div className="mt-10 sm:mt-16 container mx-auto px-4">
      <div>
        <h2 className="text-[18px] sm:text-[20px] leading-[26px] sm:leading-[30px] flex items-center text-headingColor gap-2 font-semibold">
          About of
          <span className="text-[20px] sm:text-[24px] text-irisBlueColor leading-7 sm:leading-9">
            {name}
          </span>
        </h2>
        <p className="text__para text-[14px] sm:text-[16px] mt-4">
          {about || "No information available yet 😔."}
        </p>
      </div>

      <div className="mt-8 sm:mt-12">
        <h2 className="text-[18px] sm:text-[20px] text-headingColor font-semibold leading-[26px] sm:leading-[30px]">
          Education
        </h2>
        {qualifications && qualifications.length > 0 ? (
          <ul className="p-4 md:p-5">
            {qualifications.map((item, index) => (
              <li
                key={index}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-end md:gap-5 mb-6 sm:mb-8"
              >
                <div>
                  <span className="text-irisBlueColor font-semibold text-[14px] sm:text-[15px] leading-6">
                    {formatDate(item.startingDate)} -{" "}
                    {formatDate(item.endingDate)}
                  </span>
                  <p className="text-[15px] sm:text-[16px] leading-6 text-headingColor font-medium mt-1">
                    {item.degree}
                  </p>
                </div>
                <p className="text-[13px] sm:text-[14px] leading-5 font-medium text-headingColor mt-2 sm:mt-0">
                  {item.university}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-textColor mt-4">
            No education details available yet 😔.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mt-12">
        <h2 className="text-[18px] sm:text-[20px] text-headingColor font-semibold leading-[26px] sm:leading-[30px]">
          Experience
        </h2>
        {experiences && experiences.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 md:p-5">
            {experiences.map((item, index) => (
              <li
                key={index}
                className="p-4 rounded bg-[#fff9ea] shadow-sm"
                aria-label={`Experience at ${item.hospital}`}
              >
                <span className="text-yellowColor text-[14px] sm:text-[15px] leading-6 font-semibold">
                  {formatDate(item.startingDate)} -{" "}
                  {formatDate(item.endingDate)}
                </span>
                <p className="text-[15px] sm:text-[16px] leading-6 text-headingColor font-medium mt-2">
                  {item.position}
                </p>
                <p className="text-[14px] sm:text-[15px] leading-6 text-headingColor font-medium mt-1">
                  {item.hospital}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-textColor mt-4">
            No experience details available yet 😔.
          </p>
        )}
      </div>
    </div>
  );
}
