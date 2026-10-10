import { databaseRestUrl } from "./env.ts";
import { createClient, expectThat } from "./harness.ts";
import { LEGACY_FIXTURE_PASSWORDS } from "./legacySeed.ts";
import { LEGACY_PASSWORDS, SEED_EMAILS } from "./seed.ts";

const PUBLIC_PAGES = [
  "/",
  "/doctors",
  "/doctors/d1x9",
  "/services",
  "/services-details?service=Dermatology",
  "/contact",
  "/find-location",
  "/login",
  "/register",
  "/forgot-password",
];

const COLLECTIONS = [
  "users",
  "doctors",
  "admin",
  "appointments",
  "reviews",
  "services",
  "authLinks",
  "",
];

const titleOf = (html: string): string =>
  html.match(/<title>([^<]*)<\/title>/)?.[1] || "";
const robotsOf = (html: string): string =>
  html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
const canonicalOf = (html: string): string =>
  html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || "";

export const checkDatabaseRules = async (): Promise<void> => {
  for (const collection of COLLECTIONS) {
    const read = await fetch(databaseRestUrl(collection));
    expectThat(
      `rules deny unauthenticated read of /${collection}`,
      read.status === 401,
      read.status
    );
  }
  const write = await fetch(databaseRestUrl("services/injected"), {
    method: "PUT",
    body: JSON.stringify({ name: "hacked" }),
  });
  expectThat(
    "rules deny unauthenticated writes",
    write.status === 401,
    write.status
  );
};

export const checkPublicPages = async (): Promise<void> => {
  const client = createClient("anonymous");
  const secrets = [
    ...Object.values(LEGACY_PASSWORDS).filter((value) => value.length > 3),
    ...Object.values(LEGACY_FIXTURE_PASSWORDS),
    ...SEED_EMAILS,
    "Legacy.User@Example.com",
    "Numeric.Doctor@Example.com",
    "arraypatient@example.com",
  ];

  for (const path of PUBLIC_PAGES) {
    const response = await client.get(path);
    expectThat(
      `GET ${path} returns 200`,
      response.status === 200,
      response.status
    );
    const leaked = secrets.filter((secret) => response.text.includes(secret));
    expectThat(
      `GET ${path} leaks no emails or passwords`,
      leaked.length === 0,
      leaked.join(", ")
    );
  }

  const home = await client.get("/");
  expectThat(
    "home renders services from Firebase",
    home.text.includes("Skin care") && home.text.includes("Brain care")
  );
  expectThat(
    "home renders doctors from Firebase",
    home.text.includes("Dr Sara") && home.text.includes("Dr Omar")
  );
  expectThat(
    "home has canonical URL",
    canonicalOf(home.text).replace(/\/$/, "") === "http://localhost:3100",
    canonicalOf(home.text)
  );

  const doctors = await client.get("/doctors");
  expectThat(
    "find doctor page lists rated doctors",
    doctors.text.includes("Dr Sara")
  );
  expectThat(
    "find doctor page has its own title",
    titleOf(doctors.text).startsWith("Find a Doctor |"),
    titleOf(doctors.text)
  );

  const doctor = await client.get("/doctors/d1x9");
  expectThat(
    "doctor page shows real doctor data",
    doctor.text.includes("Dr Sara") && doctor.text.includes("Cairo University")
  );
  expectThat(
    "doctor page includes Physician JSON-LD",
    doctor.text.includes('"@type":"Physician"') &&
      doctor.text.includes('"ratingValue":"9.0"')
  );
  expectThat(
    "doctor page shows reviewer names server-side",
    doctor.text.includes("Test Patient") && doctor.text.includes("Very helpful")
  );
  expectThat(
    "doctor page title uses doctor name",
    titleOf(doctor.text).startsWith("Dr Sara - Dermatology"),
    titleOf(doctor.text)
  );
  expectThat(
    "doctor page canonical",
    canonicalOf(doctor.text).endsWith("/doctors/d1x9"),
    canonicalOf(doctor.text)
  );

  const services = await client.get("/services");
  expectThat(
    "services page renders services without redirecting",
    services.status === 200 && services.text.includes("Skin care"),
    services.status
  );

  const serviceDoctors = await client.get(
    "/services-details?service=Dermatology"
  );
  expectThat(
    "service details filters doctors by specialization",
    serviceDoctors.text.includes("Dr Sara") &&
      !serviceDoctors.text.includes("Dr Omar")
  );

  const missing = await client.get("/doctors/does-not-exist");
  expectThat(
    "unknown doctor returns 404",
    missing.status === 404,
    missing.status
  );
  const notFound = await client.get("/no-such-page");
  expectThat(
    "unknown route returns 404",
    notFound.status === 404,
    notFound.status
  );
  expectThat(
    "404 page is noindex",
    robotsOf(notFound.text).includes("noindex"),
    robotsOf(notFound.text)
  );
  expectThat(
    "404 wording fixed",
    notFound.text.includes("Page You Are Looking For")
  );

  for (const path of ["/login", "/register", "/forgot-password"]) {
    const response = await client.get(path);
    expectThat(
      `${path} is noindex`,
      robotsOf(response.text).includes("noindex"),
      robotsOf(response.text)
    );
  }
  expectThat(
    "home is indexable",
    robotsOf(home.text).includes("index") &&
      !robotsOf(home.text).includes("noindex")
  );
};

export const checkRedirectsAndSeoFiles = async (): Promise<void> => {
  const client = createClient("anonymous");
  for (const [from, to] of [
    ["/home", "/"],
    ["/contcat", "/contact"],
    ["/Contcat", "/contact"],
  ] satisfies [string, string][]) {
    const response = await client.get(from);
    const location = response.headers.get("location") || "";
    expectThat(
      `${from} permanently redirects to ${to}`,
      response.status === 308 && location.endsWith(to),
      `${response.status} ${location}`
    );
  }

  const robots = await client.get("/robots.txt");
  expectThat(
    "robots.txt disallows private areas",
    robots.text.includes("Disallow: /admin/") &&
      robots.text.includes("Disallow: /api/")
  );
  expectThat(
    "robots.txt references sitemap",
    robots.text.includes("Sitemap: http://localhost:3100/sitemap.xml")
  );

  const sitemap = await client.get("/sitemap.xml");
  expectThat(
    "sitemap lists public pages",
    sitemap.text.includes("<loc>http://localhost:3100/doctors</loc>")
  );
  expectThat(
    "sitemap lists real doctor pages",
    sitemap.text.includes("/doctors/d1x9") &&
      sitemap.text.includes("/doctors/d2y8")
  );
  expectThat(
    "sitemap excludes private pages",
    !sitemap.text.includes("/admin/") && !sitemap.text.includes("/login")
  );

  const home = await client.get("/");
  expectThat(
    "security headers are set",
    home.headers.get("x-content-type-options") === "nosniff" &&
      Boolean(home.headers.get("content-security-policy"))
  );
  expectThat("X-Powered-By header removed", !home.headers.get("x-powered-by"));
};
