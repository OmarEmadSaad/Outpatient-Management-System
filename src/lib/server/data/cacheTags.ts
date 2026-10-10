import "server-only";
import { revalidateTag } from "next/cache";

export const CACHE_TAGS = Object.freeze({
  doctors: "doctors",
  services: "services",
  reviews: "reviews",
} as const);

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const PUBLIC_REVALIDATE_SECONDS = 300;

export const invalidate = (...tags: CacheTag[]): void => {
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
};
