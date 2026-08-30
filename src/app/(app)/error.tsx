"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty">
      <h1>We couldn’t load your workspace.</h1>
      <p>
        Check that MySQL is running and your database is configured, then try
        again.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
