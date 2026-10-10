import { createClient, expectThat } from "./harness.ts";
import { LEGACY_FIXTURE_PASSWORDS } from "./legacySeed.ts";
import { LEGACY_PASSWORDS, SEED_EMAILS } from "./seed.ts";

const jsonLdBlocks = (html: string): string[] =>
  [
    ...html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g
    ),
  ].map((match) => match[1] ?? "");

export const checkSeoAndGeo = async (): Promise<void> => {
  const client = createClient("crawler");

  const llms = await client.get("/llms.txt");
  expectThat(
    "llms.txt is served as plain text",
    llms.status === 200 &&
      (llms.headers.get("content-type") ?? "").startsWith("text/plain"),
    llms.status
  );
  expectThat(
    "llms.txt lists real services and doctors",
    llms.text.includes("## Services") &&
      llms.text.includes("Dermatology") &&
      llms.text.includes("Dr Sara")
  );
  expectThat(
    "llms.txt links to canonical doctor pages",
    llms.text.includes("/doctors/d1x9")
  );
  const secrets = [
    ...Object.values(LEGACY_PASSWORDS),
    ...Object.values(LEGACY_FIXTURE_PASSWORDS),
    ...SEED_EMAILS,
  ].filter((value) => value.length > 3);
  expectThat(
    "llms.txt exposes no emails or passwords",
    secrets.every((secret) => !llms.text.includes(secret))
  );
  expectThat(
    "llms.txt excludes private pages",
    !/\/login|\/admin|\/api\//.test(llms.text)
  );

  const og = await client.get("/opengraph-image");
  expectThat(
    "Open Graph image is generated",
    og.status === 200 &&
      (og.headers.get("content-type") ?? "").includes("image/png"),
    og.status
  );

  const home = await client.get("/");
  expectThat(
    "home advertises the Open Graph image",
    /<meta property="og:image"/.test(home.text) &&
      home.text.includes('name="twitter:card" content="summary_large_image"')
  );
  const siteGraph = jsonLdBlocks(home.text).join(" ");
  expectThat(
    "site graph links WebSite to the organization",
    siteGraph.includes('"@type":"WebSite"') &&
      siteGraph.includes('"publisher":{"@id"') &&
      siteGraph.includes("#organization")
  );
  expectThat(
    "organization data is not invented without configuration",
    !siteGraph.includes('"address"') && !siteGraph.includes('"telephone"')
  );
  expectThat(
    "FAQ answers are present for crawlers and start collapsed",
    home.text.includes('aria-expanded="false"') &&
      home.text.includes("One Medical was founded")
  );

  const robots = await client.get("/robots.txt");
  expectThat(
    "robots.txt names AI answer-engine crawlers",
    robots.text.includes("User-Agent: GPTBot") &&
      robots.text.includes("User-Agent: ClaudeBot") &&
      robots.text.includes("User-Agent: PerplexityBot")
  );
  expectThat(
    "AI crawlers are still kept out of private areas",
    robots.text.split("User-Agent: GPTBot")[1]?.includes("Disallow: /admin/") ??
      false
  );

  const doctor = await client.get("/doctors/d1x9");
  const doctorGraph = jsonLdBlocks(doctor.text).join(" ");
  expectThat(
    "doctor graph links the physician to the clinic",
    doctorGraph.includes('"worksFor":{"@id"') &&
      doctorGraph.includes('"url":"http://localhost:3100/doctors/d1x9"')
  );
  expectThat(
    "doctor graph includes breadcrumbs",
    doctorGraph.includes('"@type":"BreadcrumbList"') &&
      doctorGraph.includes('"name":"Find a Doctor"')
  );
  expectThat(
    "doctor graph uses real qualifications",
    doctorGraph.includes('"alumniOf"') &&
      doctorGraph.includes("Cairo University")
  );

  const service = await client.get("/services-details?service=Dermatology");
  const serviceGraph = jsonLdBlocks(service.text).join(" ");
  expectThat(
    "service page lists its doctors in structured data",
    serviceGraph.includes('"@type":"ItemList"') &&
      serviceGraph.includes("/doctors/d1x9")
  );
};
