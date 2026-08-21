import { headers } from "next/headers";
import { DomainValidationError } from "@/lib/domain";

type Bucket = { count: number; resetAt: number };
const globalRateLimits = globalThis as typeof globalThis & { __ahdahRateLimits?: Map<string, Bucket> };
const buckets = globalRateLimits.__ahdahRateLimits ?? new Map<string, Bucket>();
globalRateLimits.__ahdahRateLimits = buckets;

export async function clientAddress() {
  const requestHeaders = await headers();
  const direct = requestHeaders.get("cf-connecting-ip") || requestHeaders.get("x-real-ip");
  if (direct) return direct.trim().slice(0, 80);
  const forwarded = requestHeaders.get("x-forwarded-for");
  return (forwarded?.split(",")[0]?.trim() || "unknown").slice(0, 80);
}

export function enforceRateLimit(key: string, maxAttempts: number, windowMs: number, message: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= maxAttempts) throw new DomainValidationError([message]);
  current.count += 1;

  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
      if (buckets.size <= 4000) break;
    }
  }
}
