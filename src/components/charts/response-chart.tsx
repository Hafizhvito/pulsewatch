"use client";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function ResponseChart({
  data,
}: {
  data: { time: string; response: number | null }[];
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!data.length)
    return (
      <div className="chart-empty">
        <div className="chart-grid" />
        <span>
          No monitoring data yet.
          <small>
            Your response-time history will appear after the first check.
          </small>
        </span>
      </div>
    );
  if (!hydrated)
    return <div className="chart-empty">Loading response history…</div>;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={245}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 22, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="responseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#edf0f2"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="time"
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#84908c" }}
            minTickGap={35}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#84908c" }}
            unit="ms"
            width={65}
          />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(v) => [`${Math.round(Number(v))} ms`, "Response time"]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e6ebe8",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="response"
            stroke="#10a775"
            strokeWidth={2.5}
            fill="url(#responseFill)"
            connectNulls={false}
            dot={data.length === 1}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
