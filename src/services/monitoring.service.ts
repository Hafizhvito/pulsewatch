import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { checkEndpoint, type CheckResult } from "../lib/monitoring/check";
import { incidentAction, isDue } from "../lib/monitoring/rules";
export async function persistResult(
  id: string,
  token: string,
  result: CheckResult,
) {
  return db.$transaction(async (tx) => {
    // Acquire the row lock and reject results from expired/replaced leases or edited monitors.
    const locked = await tx.monitor.updateMany({
      where: {
        id,
        leaseToken: token,
        isActive: true,
        leaseUntil: { gt: new Date() },
      },
      data: { leaseToken: null, leaseUntil: null },
    });
    if (!locked.count) return false;
    const monitor = await tx.monitor.findUniqueOrThrow({ where: { id } });
    await tx.monitorCheck.create({ data: { monitorId: id, ...result } });
    await tx.monitor.update({
      where: { id },
      data: {
        currentStatus: result.status,
        lastCheckedAt: result.checkedAt,
        lastResponseTime: result.responseTimeMs,
      },
    });
    const action = incidentAction(monitor.currentStatus, result.status);
    if (action === "open")
      await tx.incident.create({
        data: {
          monitorId: id,
          startedAt: result.checkedAt,
          cause: result.errorMessage ?? "Endpoint unavailable.",
        },
      });
    if (action === "resolve")
      await tx.incident.updateMany({
        where: { monitorId: id, resolvedAt: null },
        data: { resolvedAt: result.checkedAt },
      });
    return true;
  });
}
export async function runCycle() {
  const due = await db.$queryRaw<
    { id: string }[]
  >`SELECT id FROM Monitor WHERE isActive = true AND (lastCheckedAt IS NULL OR TIMESTAMPADD(MINUTE, intervalMinutes, lastCheckedAt) <= UTC_TIMESTAMP(3)) AND (leaseUntil IS NULL OR leaseUntil < UTC_TIMESTAMP(3)) ORDER BY lastCheckedAt ASC LIMIT 50`;
  for (let offset = 0; offset < due.length; offset += 5) {
    await Promise.all(
      due.slice(offset, offset + 5).map(async ({ id }) => {
        const token = randomUUID();
        try {
          const monitor = await db.monitor.findUnique({ where: { id } });
          if (!monitor || !isDue(monitor)) return;
          const now = new Date();
          const claimed = await db.monitor.updateMany({
            where: {
              id,
              isActive: true,
              updatedAt: monitor.updatedAt,
              lastCheckedAt: monitor.lastCheckedAt,
              OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
            },
            data: {
              leaseToken: token,
              leaseUntil: new Date(now.getTime() + monitor.timeoutMs + 30000),
            },
          });
          if (!claimed.count) return;
          const result = await checkEndpoint(monitor);
          if (await persistResult(id, token, result))
            console.info(
              `${result.checkedAt.toISOString()} ${id} ${result.status} ${result.responseTimeMs ?? "-"}ms`,
            );
        } catch (error) {
          console.error(`Check failed for ${id}`, error);
        } finally {
          await db.monitor
            .updateMany({
              where: { id, leaseToken: token },
              data: { leaseToken: null, leaseUntil: null },
            })
            .catch((error) => console.error("Lease cleanup failed", error));
        }
      }),
    );
  }
}
