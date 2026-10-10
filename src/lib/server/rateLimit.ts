import "server-only";
import { createHash } from "node:crypto";
import type { RateLimitRecord } from "@/types/firebase";
import { getAdminDatabase, hasAdminCredentials } from "./firebaseAdmin";
import { HttpError } from "./http";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface BucketDecision {
  allowed: boolean;
  bucket: RateLimitRecord;
}

const buckets = new Map<string, RateLimitRecord>();
const MAX_TRACKED_KEYS = 10000;

const prune = (now: number): void => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

const isBucket = (value: unknown): value is RateLimitRecord =>
  Boolean(value) &&
  typeof (value as RateLimitRecord).count === "number" &&
  typeof (value as RateLimitRecord).resetAt === "number";

export const nextBucket = (
  bucket: unknown,
  { limit, windowMs }: RateLimitOptions,
  now: number
): BucketDecision => {
  if (!isBucket(bucket) || bucket.resetAt <= now) {
    return { allowed: true, bucket: { count: 1, resetAt: now + windowMs } };
  }
  if (bucket.count >= limit) return { allowed: false, bucket };
  return {
    allowed: true,
    bucket: { count: bucket.count + 1, resetAt: bucket.resetAt },
  };
};

export const consumeRateLimit = (
  key: string,
  options: RateLimitOptions,
  now: number = Date.now()
): boolean => {
  if (buckets.size > MAX_TRACKED_KEYS) prune(now);
  const { allowed, bucket } = nextBucket(buckets.get(key), options, now);
  buckets.set(key, bucket);
  return allowed;
};

const hashKey = (key: string): string =>
  createHash("sha256").update(key).digest("hex");

const PRUNE_PROBABILITY = 0.02;
const PRUNE_BATCH = 100;

const pruneExpiredSharedBuckets = async (): Promise<void> => {
  const expired = await getAdminDatabase()
    .ref("rateLimits")
    .orderByChild("resetAt")
    .endAt(Date.now())
    .limitToFirst(PRUNE_BATCH)
    .get();
  const expiredIds = Object.keys(
    (expired.val() as Record<string, unknown> | null) ?? {}
  );
  if (expiredIds.length === 0) return;
  await getAdminDatabase()
    .ref()
    .update(
      Object.fromEntries(expiredIds.map((id) => [`rateLimits/${id}`, null]))
    );
};

const consumeSharedRateLimit = async (
  key: string,
  options: RateLimitOptions
): Promise<boolean> => {
  if (Math.random() < PRUNE_PROBABILITY) {
    pruneExpiredSharedBuckets().catch(() => null);
  }
  let allowed = false;
  await getAdminDatabase()
    .ref(`rateLimits/${hashKey(key)}`)
    .transaction((current: unknown) => {
      const next = nextBucket(current, options, Date.now());
      allowed = next.allowed;
      return next.bucket;
    });
  return allowed;
};

const errorCode = (error: unknown): unknown =>
  (error as { code?: unknown } | null)?.code ?? error;

export const enforceRateLimit = async (
  key: string,
  options: RateLimitOptions
): Promise<void> => {
  const allowed = hasAdminCredentials()
    ? await consumeSharedRateLimit(key, options).catch((error: unknown) => {
        console.error("Shared rate limiter unavailable:", errorCode(error));
        return consumeRateLimit(key, options);
      })
    : consumeRateLimit(key, options);
  if (!allowed) {
    throw new HttpError(429, "Too many attempts. Please wait and try again.");
  }
};

export const resetRateLimits = (): void => buckets.clear();
