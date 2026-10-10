import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shared/site";

const PRIVATE_PATHS = [
  "/api/",
  "/login",
  "/register",
  "/forgot-password",
  "/users/",
  "/user/",
  "/admin/",
  "/doctors/profile/",
  "/appointments",
  "/patients",
  "/doctors-edite",
  "/all-services",
  "/services/",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      {
        userAgent: AI_CRAWLERS,
        allow: ["/", "/llms.txt"],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
