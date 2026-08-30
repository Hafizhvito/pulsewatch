import { requireUser } from "@/lib/auth";
import { listMonitors } from "@/services/monitor.service";
import { monitorAnalytics } from "@/services/analytics.service";
import { PageHeader, PanelHeader } from "@/components/ui/shared";
import { MonitorTable } from "@/components/monitors/monitor-table";
export default async function Monitors() {
  const user = await requireUser();
  const [monitors, analytics] = await Promise.all([
    listMonitors(user.id),
    monitorAnalytics(user.id),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="ENDPOINT MANAGEMENT"
        title="Monitors"
        description="Manage endpoint settings and review monitoring results."
      />
      <section className="panel">
        <PanelHeader
          title={`All monitors (${monitors.length})`}
          description="Select a monitor to view history, change settings, or pause checks."
        />
        <MonitorTable monitors={monitors} analytics={analytics} />
      </section>
    </>
  );
}
