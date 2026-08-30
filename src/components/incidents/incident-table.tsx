import Link from "next/link";
import type { Incident } from "@prisma/client";
import { Empty } from "@/components/ui/shared";
import { Time } from "@/components/ui/time";
export function IncidentTable({
  items,
}: {
  items: (Incident & {
    monitor: { id: string; name: string };
    durationMinutes: number;
  })[];
}) {
  if (!items.length)
    return (
      <Empty
        title="No incidents recorded"
        description="When an endpoint goes down, its incident timeline will appear here."
      />
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Monitor / cause</th>
            <th>Started</th>
            <th>Resolved</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>
                <Link className="cell-title" href={`/monitors/${i.monitorId}`}>
                  {i.monitor.name}
                </Link>
                <small className="cause">{i.cause}</small>
              </td>
              <td>
                <Time value={i.startedAt.toISOString()} />
              </td>
              <td>
                {i.resolvedAt ? (
                  <Time value={i.resolvedAt.toISOString()} />
                ) : (
                  "N/A"
                )}
              </td>
              <td>{i.durationMinutes} min</td>
              <td>
                <span
                  className={`status ${i.resolvedAt ? "resolved" : "down"}`}
                >
                  <i />
                  {i.resolvedAt ? "Resolved" : "Ongoing"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
