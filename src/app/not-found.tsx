import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Monitor could not be found.</h1>
      <p>It may have been deleted, or you may not have access.</p>
      <Link className="button primary" href="/monitors">
        Back to monitors
      </Link>
    </div>
  );
}
