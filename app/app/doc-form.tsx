"use client";

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import { BRREG_FEE, docProblems, nominal, type DocData, type Founder } from "@/lib/no-docs";
import { saveDocAction } from "./actions";

export function DocForm({ lang, caseId, initial }: { lang: Lang; caseId: number; initial: DocData }) {
  const [d, setD] = useState<DocData>(initial);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const L = (nb: string, en: string) => (lang === "nb" ? nb : en);
  const set = <K extends keyof DocData>(k: K, v: DocData[K]) => {
    setSaved(null);
    setD((x) => ({ ...x, [k]: v }));
  };
  const setFounder = (i: number, patch: Partial<Founder>) => set("founders", d.founders.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const problems = docProblems(d, lang);
  const n = nominal(d);
  const fmt = (x: number) => new Intl.NumberFormat(lang === "nb" ? "nb-NO" : "en-GB", { maximumFractionDigits: 2 }).format(x);

  function save(thenPrint = false) {
    start(async () => {
      const r = await saveDocAction(caseId, d);
      if ("error" in r) return setSaved(r.error);
      setSaved(L("Lagret.", "Saved."));
      if (thenPrint) window.location.href = `/app/sak/${caseId}/dokumenter/utskrift`;
    });
  }

  const numInput = (v: number, on: (x: number) => void, label: string, hint?: string) => (
    <label className="field">
      {label}
      <input type="number" inputMode="numeric" min={0} value={Number.isFinite(v) ? v : 0} onChange={(e) => on(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );

  return (
    <div className="layout-2">
      <div className="main stack" style={{ gap: 24 }}>
        <section className="card stack">
          <h2>{L("Selskapet", "The company")}</h2>
          <label className="field">
            {L("Foretaksnavn", "Company name")}
            <input type="text" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Eksempel AS" />
            <span className="hint">{L("Må slutte med «AS». Sjekk at navnet er ledig i Enhetsregisteret.", "Must end with «AS». Check that the name is available in the Central Coordinating Register.")}</span>
          </label>
          <div className="grid2">
            <label className="field">
              {L("Forretningskommune", "Business municipality")}
              <input type="text" value={d.kommune} onChange={(e) => set("kommune", e.target.value)} placeholder="Oslo" />
            </label>
            <label className="field">
              {L("Forretningsadresse", "Business address")}
              <input type="text" value={d.address} onChange={(e) => set("address", e.target.value)} />
            </label>
          </div>
          <label className="field">
            {L("Virksomhet (formål)", "Business purpose")}
            <textarea value={d.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder={L("Konsulenttjenester innen logistikk og det som naturlig hører sammen med dette.", "Logistics consulting and anything naturally related to it.")} />
          </label>
        </section>

        <section className="card stack">
          <h2>{L("Aksjekapital", "Share capital")}</h2>
          <div className="grid2">
            {numInput(d.shareCapital, (x) => set("shareCapital", x), L("Aksjekapital (kr)", "Share capital (NOK)"), L("Minst 30 000 kr.", "At least NOK 30,000."))}
            {numInput(d.shares, (x) => set("shares", x), L("Antall aksjer", "Number of shares"), `${L("Pålydende per aksje", "Nominal value per share")}: ${fmt(n)} kr`)}
            {numInput(d.sharePrice, (x) => set("sharePrice", x), L("Beløp som betales per aksje (kr)", "Price paid per share (NOK)"), L("Over pålydende gir overkurs, som kan dekke stiftelseskostnadene.", "Above nominal gives share premium, which can cover formation costs."))}
            <label className="field">
              {L("Frist for innbetaling", "Payment deadline")}
              <input type="date" value={d.payDeadline} onChange={(e) => set("payDeadline", e.target.value)} />
            </label>
          </div>
          {numInput(d.otherCosts, (x) => set("otherCosts", x), L("Andre stiftelseskostnader (kr)", "Other formation costs (NOK)"), `${L("I tillegg til gebyret til Brønnøysundregistrene på", "In addition to the Brønnøysund fee of")} ${fmt(BRREG_FEE)} kr.`)}
        </section>

        <section className="card stack">
          <h2>{L("Stiftere og aksjetegning", "Founders and subscription")}</h2>
          <p className="small muted">{L("Fødselsnummer lagres ikke i appen. Det fylles inn for hånd i dokumentet eller i Altinn.", "National ID numbers are not stored in the app. They are filled in by hand or in Altinn.")}</p>
          {d.founders.map((f, i) => (
            <div key={i} className="stack" style={{ gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <div className="grid2">
                <label className="field">
                  {L("Navn eller foretaksnavn", "Name or company name")}
                  <input type="text" value={f.name} onChange={(e) => setFounder(i, { name: e.target.value })} />
                </label>
                <label className="field">
                  {L("Adresse", "Address")}
                  <input type="text" value={f.address} onChange={(e) => setFounder(i, { address: e.target.value })} />
                </label>
                <label className="field">
                  {L("Organisasjonsnummer (hvis selskap)", "Org. number (if a company)")}
                  <input type="text" inputMode="numeric" value={f.orgnr} onChange={(e) => setFounder(i, { orgnr: e.target.value.replace(/\D/g, "").slice(0, 9) })} />
                </label>
                {numInput(f.shares, (x) => setFounder(i, { shares: x }), L("Antall aksjer", "Number of shares"))}
              </div>
              {d.founders.length > 1 && (
                <button type="button" className="btn danger" style={{ alignSelf: "flex-start" }} onClick={() => set("founders", d.founders.filter((_, j) => j !== i))}>
                  {L("Fjern stifter", "Remove founder")}
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => set("founders", [...d.founders, { name: "", address: "", orgnr: "", shares: 0 }])}>
            {L("Legg til stifter", "Add founder")}
          </button>
        </section>

        <section className="card stack">
          <h2>{L("Styre, daglig leder og revisor", "Board, CEO and auditor")}</h2>
          <div className="grid2">
            <label className="field">
              {L("Styreleder", "Chair of the board")}
              <input type="text" value={d.chair} onChange={(e) => set("chair", e.target.value)} />
            </label>
            <label className="field">
              {L("Styremedlemmer (kommaseparert)", "Board members (comma separated)")}
              <input type="text" value={d.boardMembers.join(", ")} onChange={(e) => set("boardMembers", e.target.value.split(",").map((x) => x.trim()))} />
            </label>
            <label className="field">
              {L("Varamedlem", "Deputy member")}
              <input type="text" value={d.deputy} onChange={(e) => set("deputy", e.target.value)} />
            </label>
            <label className="field">
              {L("Daglig leder (valgfritt)", "CEO (optional)")}
              <input type="text" value={d.ceo} onChange={(e) => set("ceo", e.target.value)} />
            </label>
            <label className="field">
              {L("Revisor (tomt = ingen revisor)", "Auditor (empty = no auditor)")}
              <input type="text" value={d.auditor} onChange={(e) => set("auditor", e.target.value)} />
              <span className="hint">{L("Små selskaper kan velge bort revisjon når vilkårene i aksjeloven § 7-6 er oppfylt.", "Small companies may opt out of audit when the conditions in s. 7-6 are met.")}</span>
            </label>
            <label className="field">
              {L("Sted for signering", "Place of signing")}
              <input type="text" value={d.place} onChange={(e) => set("place", e.target.value)} />
            </label>
          </div>
          <p className="hint">{L("Daglig leder og minst halvparten av styret må bo i Norge, EØS eller Storbritannia (aksjeloven § 6-11).", "The CEO and at least half the board must live in Norway, the EEA or the UK (s. 6-11).")}</p>
        </section>
      </div>

      <aside className="side stack" style={{ position: "sticky", top: 16 }}>
        <div className="card stack">
          <h2>{L("Kontroll", "Check")}</h2>
          {problems.length ? (
            <ul className="notes">
              {problems.map((p) => (
                <li key={p}>
                  <span className="ic minus" aria-hidden="true">
                    !
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="alert ok">{L("Dokumentene oppfyller minstekravene i aksjeloven §§ 2-2 og 2-3.", "The documents meet the minimum requirements in ss. 2-2 and 2-3.")}</p>
          )}
          <button type="button" className="btn secondary block" onClick={() => save(false)} disabled={pending}>
            {L("Lagre", "Save")}
          </button>
          <button type="button" className="btn block" onClick={() => save(true)} disabled={pending || problems.length > 0}>
            {L("Lagre og vis dokumentene", "Save and show documents")}
          </button>
          {saved && (
            <p className="small" role="status">
              {saved}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
