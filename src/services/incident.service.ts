import { db } from "@/lib/db";
export async function listIncidents(
  userId: string,
  page = 1,
  monitorId?: string,
) {
  const where = {
    monitor: { userId, ...(monitorId ? { id: monitorId } : {}) },
  };
  const [items, total] = await Promise.all([
    db.incident.findMany({
      where,
      include: { monitor: { select: { id: true, name: true } } },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.incident.count({ where }),
  ]);
  return {
    items: items.map((item) => ({
      ...item,
      durationMinutes: Math.max(
        1,
        Math.round(
          ((item.resolvedAt?.getTime() ?? Date.now()) -
            item.startedAt.getTime()) /
            60000,
        ),
      ),
    })),
    total,
  };
}
