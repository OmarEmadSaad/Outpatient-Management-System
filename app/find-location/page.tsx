import type { Metadata } from "next";
import ArrowLink from "@/components/ui/ArrowLink";
import { clinicDetails, hasClinicAddress } from "@/lib/shared/clinic";

const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509325!2d144.9537363153167!3d-37.81627997975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf0727e3b9c4c4d!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sus!4v1698765432100!5m2!1sen!2sus";

const DEFAULT_LOCATION = "Melbourne, VIC, Australia";

const clinicLocation = () => {
  const details = clinicDetails();
  if (!hasClinicAddress(details)) {
    return { label: DEFAULT_LOCATION, mapUrl: MAP_EMBED_URL };
  }
  const label = [
    details.streetAddress,
    details.city,
    details.region,
    details.country,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    label,
    mapUrl: `https://maps.google.com/maps?q=${encodeURIComponent(
      label
    )}&output=embed`,
  };
};

const locationDescription = (label: string) =>
  `Visit us at our main hospital in ${label}. We are here to provide world-class healthcare services.`;

export function generateMetadata(): Metadata {
  return {
    title: "Our Hospital Location",
    description: locationDescription(clinicLocation().label),
    alternates: { canonical: "/find-location" },
  };
}

export default function FindLocationPage() {
  const { label, mapUrl } = clinicLocation();
  return (
    <section className="bg-[#fff9ea] py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="heading text-[28px] font-bold text-headingColor">
            Our Hospital Location
          </h1>
          <p className="text__para text-[16px] leading-7 text-textColor mt-4 max-w-[600px] mx-auto">
            {locationDescription(label)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-[800px] h-[400px] rounded-lg overflow-hidden shadow-md">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hospital Location"
            ></iframe>
          </div>

          <div className="flex justify-center">
            <ArrowLink href="/" label="Back to home" />
          </div>
        </div>
      </div>
    </section>
  );
}
