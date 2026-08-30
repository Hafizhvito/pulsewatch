"use client";
import { useActionState, useState } from "react";
import { saveMonitor } from "@/app/actions";
import Link from "next/link";
import { ShieldCheck, ArrowRight, LoaderCircle } from "lucide-react";
type Values = {
  id: string;
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  intervalMinutes: number;
  timeoutMs: number;
};
export function MonitorForm({ monitor }: { monitor?: Values }) {
  const [values, setValues] = useState({
    name: monitor?.name ?? "",
    url: monitor?.url ?? "",
    method: monitor?.method ?? "GET",
    expectedStatus: String(monitor?.expectedStatus ?? 200),
    intervalMinutes: String(monitor?.intervalMinutes ?? 5),
    timeoutMs: String(monitor?.timeoutMs ?? 10000),
  });
  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => setValues((previous) => ({ ...previous, [name]: event.target.value })),
  });
  const [state, action, pending] = useActionState(
    saveMonitor.bind(null, monitor?.id ?? null),
    null,
  );
  return (
    <form action={action} className="monitor-form panel">
      <div className="form-section">
        <h2>Endpoint details</h2>
        <p>Enter a name and the URL to monitor.</p>
        <label>
          Monitor name
          <input
            name="name"
            placeholder="e.g. Production API"
            required
            maxLength={100}
            {...field("name")}
          />
        </label>
        <label>
          Endpoint URL
          <input
            name="url"
            type="url"
            placeholder="https://api.example.com/health"
            required
            maxLength={2048}
            {...field("url")}
          />
          <small>A publicly accessible HTTP or HTTPS address.</small>
        </label>
      </div>
      <div className="form-section">
        <h2>Check configuration</h2>
        <p>Set the expected response, check interval, and timeout.</p>
        <div className="form-grid">
          <label>
            HTTP method
            <select name="method" {...field("method")}>
              <option>GET</option>
              <option>HEAD</option>
              <option>POST</option>
            </select>
          </label>
          <label>
            Expected status code
            <input
              name="expectedStatus"
              type="number"
              min={100}
              max={599}
              required
              {...field("expectedStatus")}
            />
          </label>
          <label>
            Check interval <span>(minutes)</span>
            <input
              name="intervalMinutes"
              type="number"
              min={1}
              max={1440}
              required
              {...field("intervalMinutes")}
            />
          </label>
          <label>
            Timeout <span>(milliseconds)</span>
            <input
              name="timeoutMs"
              type="number"
              min={1000}
              max={30000}
              step={1000}
              required
              {...field("timeoutMs")}
            />
          </label>
        </div>
        <div className="form-note">
          <ShieldCheck size={18} />
          <p>
            Only the exact expected status counts as UP. Redirects are not
            followed. POST checks send an empty body.
          </p>
        </div>
      </div>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Link
          className="button secondary"
          href={monitor ? `/monitors/${monitor.id}` : "/monitors"}
        >
          Cancel
        </Link>
        <button className="button primary" disabled={pending}>
          {pending ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <ArrowRight size={16} />
          )}{" "}
          {pending ? "Saving…" : monitor ? "Save changes" : "Create monitor"}
        </button>
      </div>
    </form>
  );
}
