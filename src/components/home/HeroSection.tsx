import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import heroBg from "@/assets/images/hero-bg.webp";
import heroImg01 from "@/assets/images/hero-img01.png";
import heroImg02 from "@/assets/images/hero-img02.png";
import heroImg03 from "@/assets/images/hero-img03.png";
import { Button } from "@material-tailwind/react";

const stats = [
  { number: "30+", label: "Years of experience", color: "bg-yellow-400" },
  { number: "15+", label: "Clinic locations", color: "bg-purple-500" },
  { number: "100%", label: "Patient satisfaction", color: "bg-blue-500" },
];

export default function HeroSection() {
  preload(heroBg.src, { as: "image", fetchPriority: "high" });
  return (
    <section className="hero__section pt-[60px] 2xl:h-[800px] flex justify-center items-center">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-[90px] items-center justify-between">
          <div>
            <div className="lg:w-[570px] ">
              <h1 className="text-[36px] leading-[46px] font-bold text-black md:text-[60px] md:leading-[70px]">
                We help patients live a healthy, longer life
              </h1>
              <p className="text-gray-600">
                The outpatient management system helps organize patient
                appointments and simplifies the booking and cancellation
                process, reducing wait times and enhancing the overall
                healthcare experience. It allows doctors to view daily patient
                schedules and communicate with them directly through an
                integrated chat system, improving the efficiency and quality of
                medical services.
              </p>
              <Link href="/doctors" className="inline-block mt-4">
                <Button as="span" color="info" size="sm">
                  Request an Appointment
                </Button>
              </Link>
            </div>

            <div className="mt-[30px] lg:mt-[70px] flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-[30px]">
              {stats.map((item) => (
                <div key={item.label}>
                  <h2 className="text-[36px] leading-[56px] lg:text-[44px] font-bold text-black">
                    {item.number}
                  </h2>
                  <span
                    className={`w-[100px] h-2 ${item.color} rounded-full block mt-[-14px]`}
                  ></span>
                  <span className="text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-[30px] justify-end">
            <div>
              <Image
                src={heroImg01}
                className="w-full"
                alt="Hero 1"
                quality={90}
                preload
              />
            </div>
            <div className="mt-[30px]">
              <Image
                src={heroImg02}
                alt="Hero 2"
                className="w-full mb-[30px]"
                quality={90}
              />
              <Image
                src={heroImg03}
                alt="Hero 3"
                className="w-full"
                quality={90}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
