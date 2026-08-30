const buckets = new Map<string, { count: number; expires: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.expires <= now) buckets.delete(k);
  const bucket = buckets.get(key) ?? { count: 0, expires: now + windowMs };
  if (buckets.size >= 10000 && !buckets.has(key)) return false;
  bucket.count++;
  buckets.set(key, bucket);
  return bucket.count <= limit;
}
