"use client";

import { useState } from "react";
import { explainAction } from "./actions";

// AI-rådgiverens forklaring. Lagret svar vises med en gang; ellers lages det når brukeren ber om det.
export function Advice({ caseId, initial, labels }: { caseId: number; initial: string | null; labels: { title: string; ask: string; busy: string } }) {
  const [text, setText] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    setErr(null);
    const r = await explainAction(caseId);
    setBusy(false);
    if ("error" in r) setErr(r.error);
    else setText(r.text);
  }
  return (
    <section className="card stack" aria-live="polite">
      <div className="ai-row">
        <span className="ai-dot" aria-hidden="true">
          AI
        </span>
        <div className="stack" style={{ gap: 10, flex: 1 }}>
          <h2>{labels.title}</h2>
          {text ? (
            <p style={{ whiteSpace: "pre-line" }}>{text}</p>
          ) : (
            <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={go} disabled={busy}>
              {busy ? labels.busy : labels.ask}
            </button>
          )}
          {err && (
            <p className="alert error" role="alert">
              {err}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
