import type { Metadata } from "next";
import ServiceCard from "@/components/services/ServiceCard";
import { listServices } from "@/lib/server/data/publicData";
import { siteUrl } from "@/lib/shared/site";
import type { PublicService } from "@/types/domain";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "World-class care for everyone. Browse our medical services and find the doctors available for each specialty.",
  alternates: { canonical: "/services" },
};

const servicesJsonLd = (services: PublicService[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Our Services",
  itemListElement: services.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: service.name,
    url: `${siteUrl()}/services-details?service=${encodeURIComponent(
      service.name
    )}`,
  })),
});

export default async function ServicesPage() {
  const services = await listServices();
  const jsonLd = JSON.stringify(servicesJsonLd(services)).replace(
    /</g,
    "\\u003c"
  );

  return (
    <div className="container mx-auto px-4 mt-5 mb-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <h1 className="sr-only">Our Services</h1>
      {services.length === 0 ? (
        <p className="text-gray-500 text-center">No services available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {services.map((service) => (
            <ServiceCard key={service.key} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
