import type { Metadata } from "next";
import { Suspense } from "react";
import About from "@/components/home/About";
import FaqSection from "@/components/home/FaqSection";
import FeatureSection from "@/components/home/FeatureSection";
import HeroSection from "@/components/home/HeroSection";
import SectionHeading from "@/components/home/SectionHeading";
import Testimonial from "@/components/home/Testimonial";
import VirtualTreatment from "@/components/home/VirtualTreatment";
import DoctorList from "@/components/doctors/DoctorList";
import ServiceList from "@/components/services/ServiceList";
import Loading from "@/components/ui/Loading";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <About />

      <section className="flex justify-center items-center ">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <div className="xl:w-[470px] w-full">
            <h2 className="heading text-center">Our Services</h2>
            <p className="text__para text-center mt-4">
              World-class care for everyone. Our health system offers unmatched,
              expert health care.
            </p>
          </div>
        </div>
      </section>
      <Suspense fallback={<Loading />}>
        <ServiceList />
      </Suspense>

      <VirtualTreatment />

      <section>
        <div className="container">
          <SectionHeading title="Our Great Doctors" />
          <Suspense fallback={<Loading />}>
            <DoctorList />
          </Suspense>
        </div>
      </section>

      <FaqSection />

      <section>
        <div className=" container">
          <SectionHeading title="What our patients say" />
          <Testimonial />
        </div>
      </section>
    </>
  );
}
