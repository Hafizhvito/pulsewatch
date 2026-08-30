export function uptime(successful: number, total: number) {
  return total > 0 ? (successful / total) * 100 : null;
}
export function isDue(
  monitor: {
    isActive: boolean;
    lastCheckedAt: Date | null;
    intervalMinutes: number;
  },
  now = new Date(),
) {
  return (
    monitor.isActive &&
    (!monitor.lastCheckedAt ||
      now.getTime() - monitor.lastCheckedAt.getTime() >=
        monitor.intervalMinutes * 60000)
  );
}
export function evaluateStatus(actual: number, expected: number) {
  return actual === expected ? ("UP" as const) : ("DOWN" as const);
}
export function incidentAction(previous: string, next: string) {
  return next === "DOWN" && previous !== "DOWN"
    ? "open"
    : next === "UP" && previous === "DOWN"
      ? "resolve"
      : "none";
}
