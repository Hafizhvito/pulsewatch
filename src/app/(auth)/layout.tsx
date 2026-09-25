import { Activity, ShieldCheck, Radio, History } from "lucide-react";
import Link from "next/link";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          PulseWatch<span className="brand-dot">.</span>
        </Link>
        <div className="auth-pitch">
          <div className="eyebrow">UPTIME AND API MONITORING</div>
          <h1>
            Website and API
            <br />
            monitoring
          </h1>
          <p>
            Track endpoint availability, response times, and incidents from a
            single dashboard.
          </p>
          <div className="auth-features">
            <div>
              <Radio size={20} />
              <span>Scheduled HTTP availability checks</span>
            </div>
            <div>
              <History size={20} />
              <span>Incident detection and resolution history</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Managed PostgreSQL storage</span>
            </div>
          </div>
        </div>
        <small>PulseWatch | Website and API monitoring</small>
      </section>
      <section className="auth-content">
        {children}
        <p className="auth-footer">
          Monitor availability, response times, and incidents.
        </p>
      </section>
    </div>
  );
}
