import { PageHeader } from "@/components/ui/shared";
import { MonitorForm } from "@/components/monitors/monitor-form";
export default function NewMonitor() {
  return (
    <>
      <PageHeader
        eyebrow="MONITOR CONFIGURATION"
        title="Add a monitor"
        description="Configure an endpoint and its availability checks."
        action={false}
      />
      <MonitorForm />
    </>
  );
}
