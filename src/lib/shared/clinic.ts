import { SITE_NAME, siteUrl } from "./site";

export interface ClinicDetails {
  name: string;
  streetAddress?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

const optional = (value: string | undefined): string | undefined =>
  value && value.trim() ? value.trim() : undefined;

const coordinate = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : undefined;
};

const withoutEmpty = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;

export const clinicDetails = (): ClinicDetails => {
  const details: ClinicDetails = {
    name: optional(process.env.CLINIC_NAME) ?? SITE_NAME,
  };
  const streetAddress = optional(process.env.CLINIC_STREET_ADDRESS);
  const city = optional(process.env.CLINIC_CITY);
  const region = optional(process.env.CLINIC_REGION);
  const postalCode = optional(process.env.CLINIC_POSTAL_CODE);
  const country = optional(process.env.CLINIC_COUNTRY);
  const phone = optional(process.env.CLINIC_PHONE);
  const email = optional(process.env.CLINIC_EMAIL);
  const latitude = coordinate(process.env.CLINIC_LATITUDE);
  const longitude = coordinate(process.env.CLINIC_LONGITUDE);
  return {
    ...details,
    ...withoutEmpty({
      streetAddress,
      city,
      region,
      postalCode,
      country,
      phone,
      email,
      latitude,
      longitude,
    }),
  };
};

export const hasClinicAddress = (details: ClinicDetails): boolean =>
  Boolean(details.streetAddress && details.city && details.country);

export const clinicJsonLd = (): Record<string, unknown> => {
  const details = clinicDetails();
  const origin = siteUrl();
  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": hasClinicAddress(details)
      ? "MedicalClinic"
      : "MedicalOrganization",
    "@id": `${origin}/#organization`,
    name: details.name,
    url: origin,
    logo: `${origin}/favicon.png`,
    telephone: details.phone,
    email: details.email,
    address: hasClinicAddress(details)
      ? withoutEmpty({
          "@type": "PostalAddress",
          streetAddress: details.streetAddress,
          addressLocality: details.city,
          addressRegion: details.region,
          postalCode: details.postalCode,
          addressCountry: details.country,
        })
      : undefined,
    geo:
      details.latitude !== undefined && details.longitude !== undefined
        ? {
            "@type": "GeoCoordinates",
            latitude: details.latitude,
            longitude: details.longitude,
          }
        : undefined,
  });
};

export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");
