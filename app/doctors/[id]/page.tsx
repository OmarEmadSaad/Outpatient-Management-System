import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import DoctorAbout from "@/components/doctors/details/DoctorAbout";
import DoctorTabs from "@/components/doctors/details/DoctorTabs";
import Feedback from "@/components/doctors/details/Feedback";
import Sidepanel from "@/components/doctors/details/Sidepanel";
import { getPublicDoctor } from "@/lib/server/data/publicData";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/booking";
import { serializeJsonLd } from "@/lib/shared/clinic";
import { siteUrl } from "@/lib/shared/site";
import starIcon from "@/assets/images/Star.png";
import type { DoctorDetails } from "@/types/domain";

type Params = Promise<{ id: string }>;

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const loadDoctor = cache(async (params: Params) => {
  const { id } = await params;
  return getPublicDoctor(decodeURIComponent(id));
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const details = await loadDoctor(params);
  if (!details) return { title: "Doctor Not Found", robots: { index: false } };

  const { doctor } = details;
  const description = `${doctor.name}, ${doctor.specialization || "Doctor"}. ${
    doctor.bio ||
    "Doctor profile, qualifications, experience and patient feedback."
  }`;
  const path = `/doctors/${encodeURIComponent(doctor.id)}`;
  const images = doctor.photo
    ? [{ url: doctor.photo, alt: doctor.name }]
    : undefined;

  return {
    title: `${doctor.name} - ${doctor.specialization || "Doctor"}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      url: path,
      title: doctor.name,
      description,
      images,
    },
    twitter: { card: "summary", title: doctor.name, description },
  };
}

const doctorJsonLd = (
  { doctor, totalRating, averageRating }: DoctorDetails,
  photo: string
) => {
  const origin = siteUrl();
  const url = `${origin}/doctors/${encodeURIComponent(doctor.id)}`;
  const universities = [
    ...new Set(
      doctor.qualifications
        .map((item) =>
          typeof item.university === "string" ? item.university.trim() : ""
        )
        .filter(Boolean)
    ),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Physician",
        "@id": `${url}#physician`,
        url,
        name: doctor.name,
        image: photo,
        medicalSpecialty: doctor.specialization || undefined,
        description: doctor.bio || undefined,
        worksFor: { "@id": `${origin}/#organization` },
        alumniOf:
          universities.length > 0
            ? universities.map((name) => ({
                "@type": "CollegeOrUniversity",
                name,
              }))
            : undefined,
        ...(totalRating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: totalRating,
            bestRating: 10,
            worstRating: 1,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${origin}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Find a Doctor",
            item: `${origin}/doctors`,
          },
          { "@type": "ListItem", position: 3, name: doctor.name, item: url },
        ],
      },
    ],
  };
};

export default async function DoctorDetailsPage({
  params,
}: {
  params: Params;
}) {
  const details = await loadDoctor(params);
  if (!details) notFound();

  const { doctor, reviews, totalRating, averageRating } = details;
  const photo = doctor.photo || DEFAULT_AVATAR_URL;
  const jsonLd = serializeJsonLd(doctorJsonLd(details, photo));

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid md:grid-cols-3 gap-[50px]">
          <div className="md:col-span-2">
            <div className="flex items-center gap-5">
              <figure className="max-w-[200px] max-h-[200px]">
                <img
                  src={photo}
                  alt={doctor.name}
                  width={200}
                  height={200}
                  className="w-full"
                  fetchPriority="high"
                />
              </figure>
              <div>
                <span
                  className="bg-[#CCF0F3] text-irisBlueColor py-1 px-2 lg:py-2 lg:px-6 text-[12px] lg:text-[16px]
                    leading-4 lg:leading-7 font-semibold rounded"
                >
                  {doctor.specialization || "Unknown"}
                </span>
                <h1 className="text-[22px] font-bold leading-9 text-headingColor">
                  {doctor.name || "Unknown Doctor"}
                </h1>
                <div className="gap-[6px] flex items-center">
                  <span
                    className="gap-[6px] flex items-center text-[14px] leading-5
                      lg:text-[16px] lg:leading-7 text-headingColor font-semibold"
                  >
                    <Image src={starIcon} alt="Star" /> {averageRating}
                  </span>
                  <span className="text-[14px] leading-5 lg:text-[16px] lg:leading-7 text-textColor font-[400] text-gray-700">
                    ({totalRating})
                  </span>
                </div>
                <p className="text__para text-[14px] leading-5 md:text-[15px] lg:max-w-[390px]">
                  {doctor.bio || "No bio available"}
                </p>
              </div>
            </div>

            <DoctorTabs
              about={
                <DoctorAbout
                  name={doctor.name || "Unknown Doctor"}
                  about={doctor.about || "No information available"}
                  qualifications={doctor.qualifications}
                  experiences={doctor.experiences}
                />
              }
              feedback={
                <Feedback
                  reviews={reviews}
                  totalRating={totalRating}
                  doctorId={doctor.id}
                />
              }
            />
          </div>

          <div>
            <Sidepanel
              doctorId={doctor.id}
              ticketPrice={doctor.ticketPrice}
              timeSlots={doctor.timeSlots}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
