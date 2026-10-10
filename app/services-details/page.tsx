import type { Metadata } from "next";
import ServiceDoctorsGrid from "@/components/services/ServiceDoctorsGrid";
import ErrorState from "@/components/ui/ErrorState";
import { listDoctorsBySpecialization } from "@/lib/server/data/publicData";
import { serializeJsonLd } from "@/lib/shared/clinic";
import { siteUrl } from "@/lib/shared/site";
import type { PublicDoctor } from "@/types/domain";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readService = async (searchParams: SearchParams) => {
  const { service } = await searchParams;
  return typeof service === "string" ? service.slice(0, 80) : "";
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const serviceName = await readService(searchParams);
  return {
    title: serviceName ? `Doctors for ${serviceName}` : "Service Doctors",
    description: serviceName
      ? `Doctors available for ${serviceName}. Choose a doctor and book an outpatient appointment.`
      : "Doctors available for each service. Choose a doctor and book an outpatient appointment.",
    alternates: {
      canonical: serviceName
        ? `/services-details?service=${encodeURIComponent(serviceName)}`
        : "/services",
    },
    robots: serviceName ? undefined : { index: false, follow: true },
  };
}

const serviceJsonLd = (serviceName: string, doctors: PublicDoctor[]) => {
  const origin = siteUrl();
  const url = `${origin}/services-details?service=${encodeURIComponent(
    serviceName
  )}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
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
            name: "Services",
            item: `${origin}/services`,
          },
          { "@type": "ListItem", position: 3, name: serviceName, item: url },
        ],
      },
      {
        "@type": "ItemList",
        name: `Doctors for ${serviceName}`,
        itemListElement: doctors.map((doctor, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: doctor.name,
          url: `${origin}/doctors/${encodeURIComponent(doctor.id)}`,
        })),
      },
    ],
  };
};

export default async function ServicesDetailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const serviceName = await readService(searchParams);
  const doctors = serviceName
    ? await listDoctorsBySpecialization(serviceName)
    : [];

  return (
    <div className="container mx-auto py-10">
      {serviceName && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(serviceJsonLd(serviceName, doctors)),
          }}
        />
      )}
      <h1 className="text-[28px] font-bold text-headingColor text-center mb-8">
        Doctors for {serviceName || "Service"}
      </h1>
      {serviceName ? (
        <ServiceDoctorsGrid doctors={doctors} />
      ) : (
        <ErrorState
          title="No service selected"
          message="Choose a service from our services list to see the doctors available for it."
        />
      )}
    </div>
  );
}
