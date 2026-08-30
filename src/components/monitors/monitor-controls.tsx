"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Pause, Play, Trash2 } from "lucide-react";
import { deleteMonitor, toggleMonitor } from "@/app/actions";
export function MonitorControls({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const act = (remove = false) => {
    start(async () => {
      setError("");
      try {
        const result = remove
          ? await deleteMonitor(id)
          : await toggleMonitor(id, !isActive);
        if ("error" in result)
          setError(result.error ?? "Unable to update monitor.");
        else if (remove) router.push("/monitors");
        else router.refresh();
      } catch {
        setError("Unable to update monitor. Please try again.");
      }
    });
  };
  return (
    <div>
      <div className="controls">
        <Link className="button secondary" href={`/monitors/${id}/edit`}>
          <Pencil size={15} />
          Edit
        </Link>
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => act()}
        >
          {isActive ? <Pause size={15} /> : <Play size={15} />}{" "}
          {isActive ? "Pause" : "Resume"}
        </button>
        <button
          className="button danger"
          disabled={pending}
          aria-expanded={confirmDelete}
          onClick={() => setConfirmDelete(!confirmDelete)}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
      {confirmDelete && (
        <div className="form-error" role="alert">
          <strong>Delete this monitor?</strong>
          <p>All checks and incidents will be permanently deleted.</p>
          <div className="controls" style={{ marginTop: 12 }}>
            <button
              className="button secondary"
              disabled={pending}
              onClick={() => setConfirmDelete(false)}
            >
              Keep monitor
            </button>
            <button
              className="button danger"
              disabled={pending}
              onClick={() => act(true)}
            >
              Confirm deletion
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
