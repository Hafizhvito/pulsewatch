import Link from "next/link";
import type { Monitor } from "@prisma/client";
import { ArrowUpRight, Globe } from "lucide-react";
import { Empty, Status, percent, milliseconds } from "@/components/ui/shared";
import { Time } from "@/components/ui/time";
export function MonitorTable({
  monitors,
  analytics,
}: {
  monitors: Monitor[];
  analytics: Record<string, { uptime: number | null }>;
}) {
  if (!monitors.length) return <Empty action />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Monitor</th>
            <th>Status</th>
            <th>
              Uptime <span className="muted">24h</span>
            </th>
            <th>Response time</th>
            <th>Last checked</th>
            <th>
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {monitors.map((m) => (
            <tr key={m.id}>
              <td>
                <Link href={`/monitors/${m.id}`} className="monitor-identity">
                  <span className="endpoint-icon">
                    <Globe size={18} />
                  </span>
                  <span>
                    <strong>{m.name}</strong>
                    <small>{m.url}</small>
                  </span>
                </Link>
              </td>
              <td>
                <Status status={m.currentStatus} active={m.isActive} />
              </td>
              <td className="number">{percent(analytics[m.id]?.uptime)}</td>
              <td className="number">{milliseconds(m.lastResponseTime)}</td>
              <td className="muted">
                <Time value={m.lastCheckedAt?.toISOString() ?? null} />
              </td>
              <td>
                <Link
                  className="icon-button"
                  href={`/monitors/${m.id}`}
                  aria-label={`View ${m.name}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
