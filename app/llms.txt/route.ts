import { listDoctors, listServices } from "@/lib/server/data/publicData";
import type { PublicDoctor, PublicService } from "@/types/domain";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/shared/site";

export const revalidate = 3600;

const PAGES: ReadonlyArray<readonly [string, string, string]> = [
  [
    "Home",
    "/",
    "Overview of the clinic, services, doctors and patient feedback",
  ],
  [
    "Find a Doctor",
    "/doctors",
    "Search doctors by specialization and see patient ratings",
  ],
  ["Services", "/services", "Medical services offered by the clinic"],
  ["Hospital Location", "/find-location", "Where to find the hospital"],
  ["Contact", "/contact", "Send a question or feedback to the clinic team"],
];

const oneLine = (value: string): string => value.replace(/\s+/g, " ").trim();

const serviceLines = (origin: string, services: PublicService[]): string[] =>
  services
    .filter((service) => service.name)
    .map((service) => {
      const url = `${origin}/services-details?service=${encodeURIComponent(
        service.name
      )}`;
      const description = oneLine(service.desc);
      return `- [${oneLine(service.name)}](${url})${
        description ? `: ${description}` : ""
      }`;
    });

const doctorLines = (origin: string, doctors: PublicDoctor[]): string[] =>
  doctors
    .filter((doctor) => doctor.name)
    .map((doctor) => {
      const details = [doctor.specialization, doctor.bio]
        .map(oneLine)
        .filter(Boolean)
        .join(". ");
      const url = `${origin}/doctors/${encodeURIComponent(doctor.id)}`;
      return `- [${oneLine(doctor.name)}](${url})${
        details ? `: ${details}` : ""
      }`;
    });

const loadCatalog = async (): Promise<{
  services: PublicService[];
  doctors: PublicDoctor[];
}> => {
  try {
    const [services, doctors] = await Promise.all([
      listServices(),
      listDoctors(),
    ]);
    return { services, doctors };
  } catch (error) {
    console.error("llms.txt catalog unavailable:", error);
    return { services: [], doctors: [] };
  }
};

export async function GET(): Promise<Response> {
  const origin = siteUrl();
  const { services, doctors } = await loadCatalog();
  const sections = [
    `# ${SITE_NAME}`,
    `> ${DEFAULT_DESCRIPTION}`,
    "Patients can find doctors by specialization, read patient reviews, and book outpatient appointments online. Booking and dashboards require an account.",
    "## Pages",
    ...PAGES.map(
      ([title, path, description]) =>
        `- [${title}](${origin}${path}): ${description}`
    ),
  ];
  const serviceSection = serviceLines(origin, services);
  if (serviceSection.length > 0)
    sections.push("## Services", ...serviceSection);
  const doctorSection = doctorLines(origin, doctors);
  if (doctorSection.length > 0) sections.push("## Doctors", ...doctorSection);

  return new Response(`${sections.join("\n\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
