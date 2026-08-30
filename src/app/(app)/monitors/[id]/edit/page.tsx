import { requireUser } from "@/lib/auth";
import { ownedMonitor } from "@/services/monitor.service";
import { PageHeader } from "@/components/ui/shared";
import { MonitorForm } from "@/components/monitors/monitor-form";
export default async function EditMonitor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const monitor = await ownedMonitor((await params).id, user.id);
  return (
    <>
      <PageHeader
        eyebrow="MONITOR CONFIGURATION"
        title="Edit monitor"
        description={monitor.name}
        action={false}
      />
      <MonitorForm
        monitor={{
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          method: monitor.method,
          expectedStatus: monitor.expectedStatus,
          intervalMinutes: monitor.intervalMinutes,
          timeoutMs: monitor.timeoutMs,
        }}
      />
    </>
  );
}
