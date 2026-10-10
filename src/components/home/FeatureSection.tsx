import Image from "next/image";
import ArrowLink from "@/components/ui/ArrowLink";
import icon01 from "@/assets/images/icon01.png";
import icon02 from "@/assets/images/icon02.png";
import icon03 from "@/assets/images/icon03.png";

const features = [
  { icon: icon01, title: "Find a Doctor", href: "/doctors" },
  { icon: icon02, title: "Find a Location", href: "/find-location" },
  { icon: icon03, title: "Book Appointment", href: "/doctors" },
];

export default function FeatureSection() {
  return (
    <section className="flex justify-center items-center py-[60px]">
      <div className="container">
        <div className="flex justify-center items-center">
          <div className="lg:w-[470px]">
            <h2 className="text-center text-2xl font-bold text-black">
              Providing the best medical services
            </h2>
            <p className="text-center text-gray-600 mt-4">
              World-class care for everyone. Our health system offers unmatched,
              expert health care.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px]">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="py-[30px] px-5 flex flex-col items-center text-center"
            >
              <div className="flex justify-center items-center">
                <Image src={feature.icon} alt={feature.title} />
              </div>

              <div className="mt-[30px] space-y-4">
                <h2 className="text-[26px] leading-9 text-headingColor font-[700]">
                  {feature.title}
                </h2>
                <p className="text-[16px] leading-7 font-[400] text-textColor">
                  World-class care for everyone. Our health system offers
                  unmatched, expert health care from the lab clinic.
                </p>
                <div className="flex justify-center">
                  <ArrowLink href={feature.href} label={feature.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
