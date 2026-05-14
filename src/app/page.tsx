import Link from "next/link";

const cards = [
  {
    title: "Participant Betting",
    body: "Daily match bets lock for everyone at 12:00 Israel time or the first kickoff of the day, whichever comes first.",
  },
  {
    title: "Admin Control",
    body: "Admins can enter results, publish leaderboard snapshots, and perform audited late-entry overrides when needed.",
  },
  {
    title: "Scoring Engine",
    body: "Rules live in tested TypeScript code, based on the World Cup 2026 rules spec rather than spreadsheet formulas.",
  },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-title">Mondibet</div>
          <div className="brand-subtitle">FIFA World Cup 2026 betting manager</div>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" href="/dashboard">
            Dashboard
          </Link>
          <Link className="primary-link" href="/login">
            Sign in
          </Link>
        </div>
      </header>

      <section className="dashboard" aria-label="Application foundations">
        {cards.map((card) => (
          <article className="panel" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
