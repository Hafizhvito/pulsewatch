import Link from "next/link";
import { Plus, Radio, ArrowUpRight } from "lucide-react";
export function Status({
  status,
  active = true,
}: {
  status: string;
  active?: boolean;
}) {
  return (
    <span className={`status ${!active ? "paused" : status.toLowerCase()}`}>
      <i />
      {!active
        ? "Paused"
        : status === "UP"
          ? "Operational"
          : status === "DOWN"
            ? "Down"
            : "Pending"}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: boolean;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Link href="/monitors/new" className="button primary">
          <Plus size={17} />
          Add monitor
        </Link>
      )}
    </div>
  );
}
export function Empty({
  title = "No monitors yet",
  description = "Start monitoring your first website or API.",
  action = false,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Radio size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Link className="button primary" href="/monitors/new">
          <Plus size={16} />
          Add your first monitor
        </Link>
      )}
    </div>
  );
}
export function PanelHeader({
  title,
  description,
  href,
  link = "View all",
}: {
  title: string;
  description?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {link}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        {label}
        <span>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <small>{detail}</small>
    </div>
  );
}
export function percent(value: number | null | undefined) {
  return value == null ? "No data" : `${value.toFixed(2)}%`;
}
export function milliseconds(value: number | null | undefined) {
  return value == null ? "N/A" : `${Math.round(value)} ms`;
}
