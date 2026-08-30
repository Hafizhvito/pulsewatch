import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listIncidents } from "@/services/incident.service";
import { PageHeader, PanelHeader } from "@/components/ui/shared";
import { IncidentTable } from "@/components/incidents/incident-table";
export default async function Incidents({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const input = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(input)
    ? Math.min(100000, Math.max(1, input))
    : 1;
  const { items, total } = await listIncidents(user.id, page);
  return (
    <>
      <PageHeader
        eyebrow="INCIDENT MANAGEMENT"
        title="Incidents"
        description="Review outages, causes, duration, and recovery times."
        action={false}
      />
      <section className="panel">
        <PanelHeader
          title="Incident timeline"
          description={`${total} recorded incidents · Newest first`}
        />
        <IncidentTable items={items} />
        {total > 20 && (
          <div className="pagination">
            {page > 1 && (
              <Link
                className="button secondary"
                href={`/incidents?page=${page - 1}`}
              >
                Previous
              </Link>
            )}
            <span>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            {page * 20 < total && (
              <Link
                className="button secondary"
                href={`/incidents?page=${page + 1}`}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}
