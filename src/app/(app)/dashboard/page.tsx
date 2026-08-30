import {
  Activity,
  Radio,
  CheckCheck,
  TriangleAlert,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMonitors } from "@/services/monitor.service";
import {
  monitorAnalytics,
  responseHistory,
} from "@/services/analytics.service";
import { listIncidents } from "@/services/incident.service";
import {
  PageHeader,
  Metric,
  PanelHeader,
  percent,
} from "@/components/ui/shared";
import { MonitorTable } from "@/components/monitors/monitor-table";
import { IncidentTable } from "@/components/incidents/incident-table";
import { ResponseChart } from "@/components/charts/response-chart";
export default async function Dashboard() {
  const user = await requireUser();
  const [monitors, analytics, history, incidents] = await Promise.all([
    listMonitors(user.id),
    monitorAnalytics(user.id),
    responseHistory(user.id),
    listIncidents(user.id),
  ]);
  const online = monitors.filter(
      (m) => m.isActive && m.currentStatus === "UP",
    ).length,
    offline = monitors.filter(
      (m) => m.isActive && m.currentStatus === "DOWN",
    ).length;
  const measured = Object.values(analytics).filter((a) => a.uptime !== null);
  const average = measured.length
    ? measured.reduce((sum, a) => sum + (a.uptime ?? 0), 0) / measured.length
    : null;
  const active = monitors.filter((m) => m.isActive).length;
  return (
    <>
      <PageHeader
        eyebrow="MONITORING"
        title="Overview"
        description="Monitor availability, response times, and incidents."
      />
      <div className={`health-banner ${offline ? "has-outage" : ""}`}>
        <div className="health-icon">
          {offline ? <TriangleAlert size={21} /> : <CheckCheck size={21} />}
        </div>
        <div>
          <strong>
            {offline
              ? `${offline} endpoint${offline > 1 ? "s" : ""} need attention`
              : online
                ? "All checked systems are operational"
                : active
                  ? "Awaiting initial checks"
                  : "No active monitors"}
          </strong>
          <p>
            {offline
              ? "Review active incidents for failure details."
              : online
                ? `${online} online · ${active - online} awaiting a result · ${monitors.length - active} paused`
                : active
                  ? "The monitoring worker will check your endpoints shortly."
                  : "Add a monitor to begin checking endpoint availability."}
          </p>
        </div>
        <span className="banner-label">
          <span className="live-dot" />
          {offline ? "Attention needed" : "Monitoring overview"}
        </span>
      </div>
      <div className="metrics">
        <Metric
          label="Total monitors"
          value={monitors.length}
          detail={`${active} active · ${monitors.length - active} paused`}
          icon={<Radio size={18} />}
        />
        <Metric
          label="Online"
          value={online}
          detail="Responding as expected"
          icon={<CheckCheck size={18} />}
        />
        <Metric
          label="Offline"
          value={offline}
          detail={
            offline ? "Endpoints needing attention" : "No detected outages"
          }
          icon={<TriangleAlert size={18} />}
        />
        <Metric
          label="Average uptime"
          value={percent(average)}
          detail="Across monitored endpoints · 24h"
          icon={<Activity size={18} />}
        />
      </div>
      <section className="panel">
        <PanelHeader
          title="Monitor status"
          description="Current availability and latest check results."
          href="/monitors"
          link="All monitors"
        />
        <MonitorTable monitors={monitors.slice(0, 6)} analytics={analytics} />
        <div className="panel-foot">
          <span className="live-dot" />
          Status updates automatically as checks arrive
          <span>{monitors.length} monitors</span>
        </div>
      </section>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Response time</h2>
              <p>Hourly average across your endpoints</p>
            </div>
            <span className="period">
              <Clock3 size={13} />
              Last 24 hours
            </span>
          </div>
          <ResponseChart
            data={history.map((h) => ({
              time: h.time,
              response: h.response === null ? null : Number(h.response),
            }))}
          />
          <div className="chart-legend">
            <span /> Average response time <small>Lower is better</small>
          </div>
        </section>
        <section className="insight-card">
          <span className="insight-icon">
            <Activity size={23} />
          </span>
          <div className="eyebrow">CHECK ACTIVITY</div>
          <h2>Monitoring activity</h2>
          <p>
            Total availability checks recorded across your monitors in the last
            24 hours.
          </p>
          <div className="insight-stat">
            <strong>
              {Object.values(analytics)
                .reduce((s, a) => s + a.total, 0)
                .toLocaleString()}
            </strong>
            <span>checks in the last 24 hours</span>
          </div>
          <Link href="/monitors">
            View monitors <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <PanelHeader
          title="Recent incidents"
          description="Recent outages and their resolution status."
          href="/incidents"
          link="Incident history"
        />
        <IncidentTable items={incidents.items.slice(0, 4)} />
      </section>
    </>
  );
}
