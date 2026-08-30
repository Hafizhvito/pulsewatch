import { db } from "@/lib/db";
import { uptime } from "@/lib/monitoring/rules";
export async function monitorAnalytics(
  userId: string,
  days = 1,
  monitorId?: string,
) {
  const groups = await db.monitorCheck.groupBy({
    by: ["monitorId", "status"],
    where: {
      monitor: { userId, ...(monitorId ? { id: monitorId } : {}) },
      checkedAt: { gte: new Date(Date.now() - days * 86400000) },
    },
    _count: { _all: true },
    _avg: { responseTimeMs: true },
  });
  const result: Record<
    string,
    {
      total: number;
      successful: number;
      failed: number;
      uptime: number | null;
      average: number | null;
    }
  > = {};
  // Average latency uses only attempts that received an HTTP response.
  const averages = await db.monitorCheck.groupBy({
    by: ["monitorId"],
    where: {
      monitor: { userId, ...(monitorId ? { id: monitorId } : {}) },
      checkedAt: { gte: new Date(Date.now() - days * 86400000) },
    },
    _avg: { responseTimeMs: true },
  });
  for (const group of groups) {
    const entry = result[group.monitorId] ?? {
      total: 0,
      successful: 0,
      failed: 0,
      uptime: null,
      average: null,
    };
    entry.total += group._count._all;
    if (group.status === "UP") entry.successful += group._count._all;
    if (group.status === "DOWN") entry.failed += group._count._all;
    entry.uptime = uptime(entry.successful, entry.total);
    result[group.monitorId] = entry;
  }
  for (const group of averages)
    if (result[group.monitorId])
      result[group.monitorId].average = group._avg.responseTimeMs;
  return result;
}
export async function responseHistory(userId: string, monitorId?: string) {
  // Aggregate hourly in MySQL; never transfer unbounded raw history to the UI.
  return db.$queryRaw<
    { time: string; response: number | null; checks: bigint }[]
  >`SELECT DATE_FORMAT(c.checkedAt, '%Y-%m-%dT%H:00:00Z') AS time, AVG(c.responseTimeMs) AS response, COUNT(*) AS checks FROM MonitorCheck c JOIN Monitor m ON c.monitorId=m.id WHERE m.userId=${userId} AND (${monitorId ?? null} IS NULL OR m.id=${monitorId ?? null}) AND c.checkedAt >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR) GROUP BY time ORDER BY time ASC`;
}
