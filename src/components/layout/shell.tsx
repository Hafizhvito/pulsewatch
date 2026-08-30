"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  LayoutDashboard,
  Radio,
  TriangleAlert,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/monitors", label: "Monitors", icon: Radio },
  { href: "/incidents", label: "Incidents", icon: TriangleAlert },
];
export function Shell({
  children,
  name,
  email,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, [router]);
  return (
    <div className="app-shell">
      <button
        className="mobile-menu icon-button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">
            <Activity size={23} />
          </span>
          PulseWatch<span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<small>Self-hosted monitoring</small>
          </div>
          <span className="workspace-tag">MVP</span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={path.startsWith(href) ? "nav-link active" : "nav-link"}
            >
              <Icon size={19} />
              {label}
              {path.startsWith(href) && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note">
            <Activity size={20} />
            <strong>Background monitoring</strong>
            <p>Keep the monitoring worker running to collect check results.</p>
            <Link href="/monitors">
              Manage monitors <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="profile">
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <small>{email}</small>
            </div>
            <button
              className="icon-button"
              title="Log out"
              aria-label="Log out"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>
              {links.find((l) => path.startsWith(l.href))?.label ?? "Monitors"}
            </strong>
          </span>
          <div className="topbar-right">
            <span className="live-dot" /> Auto-refresh · 30s{" "}
            <span className="avatar small">
              {name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          PulseWatch <span>Uptime and API monitoring</span>
          <span className="footer-right">Self-hosted monitoring</span>
        </footer>
      </div>
    </div>
  );
}
