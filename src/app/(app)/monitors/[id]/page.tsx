import Link from "next/link";
import { Activity, Clock3, ArrowLeft, CheckCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ownedMonitor } from "@/services/monitor.service";
import {
  monitorAnalytics,
  responseHistory,
} from "@/services/analytics.service";
import { listIncidents } from "@/services/incident.service";
import {
  Status,
  Metric,
  PanelHeader,
  Empty,
  percent,
  milliseconds,
} from "@/components/ui/shared";
import { Time } from "@/components/ui/time";
import { ResponseChart } from "@/components/charts/response-chart";
import { MonitorControls } from "@/components/monitors/monitor-controls";
import { IncidentTable } from "@/components/incidents/incident-table";
export default async function MonitorDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const monitor = await ownedMonitor(id, user.id);
  const [a1, a7, a30, history, checks, incidents] = await Promise.all([
    monitorAnalytics(user.id, 1, id),
    monitorAnalytics(user.id, 7, id),
    monitorAnalytics(user.id, 30, id),
    responseHistory(user.id, id),
    db.monitorCheck.findMany({
      where: { monitorId: id, monitor: { userId: user.id } },
      orderBy: { checkedAt: "desc" },
      take: 50,
    }),
    listIncidents(user.id, 1, id),
  ]);
  return (
    <>
      <Link className="back-link" href="/monitors">
        <ArrowLeft size={15} />
        All monitors
      </Link>
      <div className="page-header">
        <div>
          <div className="eyebrow">ENDPOINT HEALTH</div>
          <h1>{monitor.name}</h1>
          <a
            className="endpoint-url"
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
          >
            {monitor.url}
          </a>
        </div>
        <MonitorControls id={id} isActive={monitor.isActive} />
      </div>
      <div className="detail-meta">
        <Status status={monitor.currentStatus} active={monitor.isActive} />
        <span>
          {monitor.method} · Expected {monitor.expectedStatus}
        </span>
        <span>
          Every {monitor.intervalMinutes} min · Timeout{" "}
          {monitor.timeoutMs / 1000}s
        </span>
        <span>
          Last check:{" "}
          <Time value={monitor.lastCheckedAt?.toISOString() ?? null} />
        </span>
      </div>
      <div className="metrics">
        <Metric
          label="Uptime · 24 hours"
          value={percent(a1[id]?.uptime)}
          detail={`${a1[id]?.successful ?? 0} successful / ${a1[id]?.total ?? 0} checks`}
          icon={<Activity size={18} />}
        />
        <Metric
          label="Uptime · 7 days"
          value={percent(a7[id]?.uptime)}
          detail={`${a7[id]?.failed ?? 0} failed checks`}
          icon={<CheckCheck size={18} />}
        />
        <Metric
          label="Uptime · 30 days"
          value={percent(a30[id]?.uptime)}
          detail={`${a30[id]?.total ?? 0} total checks`}
          icon={<Activity size={18} />}
        />
        <Metric
          label="Average response"
          value={milliseconds(a1[id]?.average)}
          detail="HTTP responses · Last 24 hours"
          icon={<Clock3 size={18} />}
        />
      </div>
      <section className="panel">
        <PanelHeader
          title="Response time history"
          description="Hourly averages · Last 24 hours"
        />
        <ResponseChart
          data={history.map((h) => ({
            time: h.time,
            response: h.response === null ? null : Number(h.response),
          }))}
        />
      </section>
      <section className="panel">
        <PanelHeader
          title="Check status history"
          description="Latest 50 checks · Oldest to newest"
        />
        {checks.length ? (
          <div className="status-history">
            {[...checks].reverse().map((c) => (
              <span
                key={c.id}
                className={c.status.toLowerCase()}
                title={`${c.checkedAt.toISOString()} · ${c.status} · HTTP ${c.statusCode ?? "N/A"}`}
              />
            ))}
            <div>
              <span>Older</span>
              <span>Latest check</span>
            </div>
          </div>
        ) : (
          <Empty
            title="No monitoring data yet"
            description="Keep the monitoring worker running to start collecting checks."
          />
        )}
      </section>
      <section className="panel">
        <PanelHeader
          title="Recent checks"
          description="The latest 50 monitoring attempts"
        />
        {checks.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Checked at</th>
                  <th>Status</th>
                  <th>HTTP code</th>
                  <th>Response time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Time value={c.checkedAt.toISOString()} />
                    </td>
                    <td>
                      <Status status={c.status} />
                    </td>
                    <td>{c.statusCode ?? "N/A"}</td>
                    <td>{milliseconds(c.responseTimeMs)}</td>
                    <td className="cause">{c.errorMessage ?? "As expected"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No monitoring data yet"
            description="Your first check will appear here shortly."
          />
        )}
      </section>
      <section className="panel">
        <PanelHeader
          title="Incident history"
          description={`${incidents.total} incidents recorded`}
          href="/incidents"
        />
        <IncidentTable items={incidents.items} />
      </section>
    </>
  );
}
