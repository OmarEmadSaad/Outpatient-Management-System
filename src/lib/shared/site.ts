import type { Metadata } from "next";

export const SITE_NAME = "OSM - Outpatient Management System";

export const DEFAULT_DESCRIPTION =
  "The outpatient management system helps organize patient appointments and simplifies the booking and cancellation process, reducing wait times and enhancing the overall healthcare experience.";

export const siteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
};

export const PRIVATE_ROBOTS = { index: false, follow: false } as const;

export const privatePageMetadata = (title: string): Metadata => ({
  title,
  robots: PRIVATE_ROBOTS,
});
