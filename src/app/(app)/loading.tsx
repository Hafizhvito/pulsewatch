export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading monitoring data">
      <div className="skeleton title-skeleton" />
      <div className="metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton card-skeleton" />
        ))}
      </div>
      <div className="skeleton panel-skeleton" />
    </div>
  );
}
