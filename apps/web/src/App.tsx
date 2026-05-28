const panels = [
  {
    title: "Daily Opportunities",
    body: "No recommendations are generated until data, citations, risk, and evidence gates exist."
  },
  {
    title: "Strategy Evidence",
    body: "Strategies start as hypotheses and require reproducible validation before paper-trade eligibility."
  },
  {
    title: "Data Freshness",
    body: "Provider timestamps and quality checks will drive confidence and no-trade outcomes."
  },
  {
    title: "Paper Trading",
    body: "Simulated decisions will be recorded before any future broker integration is considered."
  }
];

export function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Milestone 1</p>
          <h1>StockMarket Operator Console</h1>
        </div>
        <span className="status-pill">Research MVP</span>
      </header>

      <section className="summary-band">
        <p>Research first. Paper trading first. Live trading prohibited.</p>
        <p>No good trades today is a valid outcome.</p>
      </section>

      <section className="panel-grid" aria-label="Operator workflow preview panels">
        {panels.map((panel) => (
          <article className="panel" key={panel.title}>
            <h2>{panel.title}</h2>
            <p>{panel.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
