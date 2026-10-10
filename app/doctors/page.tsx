import type { Metadata } from "next";
import DoctorsBrowser from "@/components/doctors/DoctorsBrowser";
import SectionHeading from "@/components/home/SectionHeading";
import Testimonial from "@/components/home/Testimonial";
import { listDoctors } from "@/lib/server/data/publicData";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Find a Doctor",
  description:
    "Find a doctor by specialization, compare patient ratings, and book an outpatient appointment.",
  alternates: { canonical: "/doctors" },
};

export default async function DoctorsPage() {
  const doctors = await listDoctors();

  return (
    <>
      <DoctorsBrowser doctors={doctors} />
      <section>
        <div className="container">
          <SectionHeading title="What our patients say" />
          <Testimonial />
        </div>
      </section>
    </>
  );
}
