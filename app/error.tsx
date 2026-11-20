"use client";

// Vises hvis en side krasjer. Feilkoden (digest) finnes igjen i loggen på Render.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page">
      <div className="wrap stack" style={{ maxWidth: 560, alignItems: "flex-start" }}>
        <h1>Noe gikk galt / Something went wrong</h1>
        <p className="muted">
          Prøv igjen. Hvis feilen fortsetter, oppgi denne koden til support: <strong>{error.digest ?? "ukjent"}</strong>
        </p>
        <button className="btn" type="button" onClick={() => reset()}>
          Prøv igjen / Try again
        </button>
      </div>
    </main>
  );
}
