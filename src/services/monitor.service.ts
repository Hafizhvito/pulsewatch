import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Monitor } from "@prisma/client";
type EditableMonitor = Partial<
  Pick<
    Monitor,
    | "name"
    | "url"
    | "method"
    | "expectedStatus"
    | "timeoutMs"
    | "intervalMinutes"
    | "isActive"
  >
>;
export async function updateOwnedMonitor(
  id: string,
  userId: string,
  data: EditableMonitor,
) {
  return db.monitor.updateMany({
    where: { id, userId },
    data: { ...data, leaseToken: null, leaseUntil: null },
  });
}
export async function deleteOwnedMonitor(id: string, userId: string) {
  return db.monitor.deleteMany({ where: { id, userId } });
}
export async function ownedMonitor(id: string, userId: string) {
  const monitor = await db.monitor.findFirst({ where: { id, userId } });
  if (!monitor) notFound();
  return monitor;
}
export async function listMonitors(userId: string) {
  return db.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
