"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function Time({ value }: { value: string | null }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!value) return <span>Not checked yet</span>;
  return (
    <time dateTime={value} title={value}>
      {hydrated
        ? new Date(value).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC"}
    </time>
  );
}
