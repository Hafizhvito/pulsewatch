"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty">
      <h1>We couldn’t load your workspace.</h1>
      <p>
        We couldn’t retrieve your workspace data. Please try again in a moment.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
