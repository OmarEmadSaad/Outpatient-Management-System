import type { MetadataRoute } from "next";
import { listDoctors, listServices } from "@/lib/server/data/publicData";
import { siteUrl } from "@/lib/shared/site";

export const revalidate = 3600;

interface SitemapRoute {
  path: string;
  priority: number;
}

const STATIC_ROUTES: SitemapRoute[] = [
  { path: "/", priority: 1 },
  { path: "/doctors", priority: 0.9 },
  { path: "/services", priority: 0.8 },
  { path: "/find-location", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
];

const loadDoctorRoutes = async (): Promise<SitemapRoute[]> => {
  try {
    const doctors = await listDoctors();
    return doctors.map((doctor) => ({
      path: `/doctors/${encodeURIComponent(doctor.id)}`,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap doctor routes unavailable:", error);
    return [];
  }
};

const loadServiceRoutes = async (): Promise<SitemapRoute[]> => {
  try {
    const services = await listServices();
    return services
      .filter((service) => service.name)
      .map((service) => ({
        path: `/services-details?service=${encodeURIComponent(service.name)}`,
        priority: 0.6,
      }));
  } catch (error) {
    console.error("Sitemap service routes unavailable:", error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const [doctorRoutes, serviceRoutes] = await Promise.all([
    loadDoctorRoutes(),
    loadServiceRoutes(),
  ]);
  const routes = [...STATIC_ROUTES, ...doctorRoutes, ...serviceRoutes];
  return routes.map(({ path, priority }) => ({
    url: `${origin}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
