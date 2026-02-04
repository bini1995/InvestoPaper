export default function Card({ title, action, children }) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
