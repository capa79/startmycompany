"use client";

import { useState, useTransition } from "react";
import type { Lang, T2 } from "@/lib/i18n";
import { BUSINESS, CAPITAL, capitalLabel, CUSTOMERS, EID, NEEDS, OWNERS, PRIOS, RESIDENCE, type Opt, type Profile } from "@/lib/profile";
import { interpretAction, saveInterviewAction } from "./actions";

const t = (lang: Lang, x: T2) => x[lang];

function Chips({ opts, value, multi, onChange, lang, name }: { opts: Opt[]; value: string | string[]; multi?: boolean; onChange: (v: string | string[]) => void; lang: Lang; name: string }) {
  const on = (id: string) => (multi ? (value as string[]).includes(id) : value === id);
  const toggle = (id: string) => {
    if (!multi) return onChange(id);
    const cur = value as string[];
    // «Ingenting lokalt» / «Ingen av disse» utelukker de andre valgene
    const exclusive = id === "ingen" || id === "none";
    if (exclusive) return onChange(cur.includes(id) ? [] : [id]);
    const base = cur.filter((x) => x !== "ingen" && x !== "none");
    onChange(base.includes(id) ? base.filter((x) => x !== id) : [...base, id]);
  };
  return (
    <div className="chips" role="group" aria-label={name}>
      {opts.map((o) => (
        <button key={o.id} type="button" className="chip" aria-pressed={on(o.id)} onClick={() => toggle(o.id)}>
          {t(lang, o.label)}
        </button>
      ))}
    </div>
  );
}

function Ask({ children }: { children: React.ReactNode }) {
  return (
    <div className="ai-row">
      <span className="ai-dot" aria-hidden="true">
        AI
      </span>
      <div className="stack" style={{ gap: 10, minWidth: 0, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export function Interview({ lang, aiOn, caseId, initial, cur, nokPerUnit }: { lang: Lang; aiOn: boolean; caseId: number | null; initial: Profile; cur: string; nokPerUnit: number }) {
  // Kapitalvalgene vises i brukerens valuta
  const capitalOpts: Opt[] = CAPITAL.map((c) => ({ id: c.id, label: { nb: capitalLabel(c.id, "nb", cur, nokPerUnit), en: capitalLabel(c.id, "en", cur, nokPerUnit) } }));
  const [p, setP] = useState<Profile>(initial);
  const [step, setStep] = useState(initial.business ? 6 : 0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const L = (nb: string, en: string) => (lang === "nb" ? nb : en);
  const hint = BUSINESS.find((b) => b.id === p.business)?.hint;

  const next = (n: number) => setStep((s) => Math.max(s, n));

  async function interpret() {
    setAiBusy(true);
    setAiMsg(null);
    const r = await interpretAction(p.description);
    setAiBusy(false);
    if ("error" in r) return setAiMsg(r.error);
    setP((x) => ({ ...x, business: r.business, description: r.purpose }));
    next(1);
  }

  function submit() {
    setError(null);
    startSave(async () => {
      try {
        await saveInterviewAction(caseId, p);
      } catch (e) {
        // Viderekobling kastes som et spesielt unntak og skal ikke vises som feil
        const msg = e instanceof Error ? e.message : String(e);
        if (!/NEXT_REDIRECT/.test(msg)) setError(msg);
      }
    });
  }

  const answered = [p.business, p.residence, p.owners, p.prios.length ? "x" : "", p.needs.length ? "x" : "", p.capital].filter(Boolean).length;
  const ready = Boolean(p.business && p.residence);

  return (
    <div className="layout-2">
      <section className="main stack" aria-label={L("Intervju", "Interview")} style={{ gap: 22 }}>
        <Ask>
          <p className="bubble">{L("Hva skal selskapet drive med? Velg det som passer best, eller beskriv det med egne ord.", "What will the company do? Pick the best fit, or describe it in your own words.")}</p>
          <Chips lang={lang} name={L("Type virksomhet", "Type of business")} opts={BUSINESS} value={p.business} onChange={(v) => (set("business", v as string), next(1))} />
          <label className="field">
            <span className="sr-only">{L("Beskriv virksomheten", "Describe the business")}</span>
            <textarea value={p.description} onChange={(e) => set("description", e.target.value)} placeholder={L("F.eks. «Konsulenttjenester innen logistikk for kunder i Norden»", "E.g. «Logistics consulting for clients in the Nordics»")} />
          </label>
          {aiOn && (
            <div className="row">
              <button type="button" className="btn secondary" onClick={interpret} disabled={aiBusy || p.description.trim().length < 5}>
                {aiBusy ? L("Tenker …", "Thinking …") : L("La AI tolke beskrivelsen", "Let AI interpret it")}
              </button>
              {aiMsg && <span className="small" role="status">{aiMsg}</span>}
            </div>
          )}
          {hint && <p className="bubble small">{t(lang, hint)}</p>}
        </Ask>

        {step >= 1 && (
          <Ask>
            <p className="bubble">{L("Hvor bor du, og hvilken elektronisk ID har du? Det avgjør om du kan stifte digitalt.", "Where do you live, and which electronic ID do you have? That decides whether you can form the company online.")}</p>
            <Chips lang={lang} name={L("Bosted", "Residence")} opts={RESIDENCE} value={p.residence} onChange={(v) => set("residence", v as string)} />
            <Chips lang={lang} name={L("Elektronisk ID", "Electronic ID")} multi opts={EID} value={p.eids} onChange={(v) => set("eids", v as string[])} />
            {step === 1 && (
              <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} disabled={!p.residence} onClick={() => next(2)}>
                {L("Neste", "Next")}
              </button>
            )}
          </Ask>
        )}

        {step >= 2 && (
          <Ask>
            <p className="bubble">{L("Hvem skal eie selskapet, og hvor er kundene?", "Who will own the company, and where are the customers?")}</p>
            <Chips lang={lang} name={L("Eiere", "Owners")} opts={OWNERS} value={p.owners} onChange={(v) => set("owners", v as string)} />
            <Chips lang={lang} name={L("Kunder", "Customers")} multi opts={CUSTOMERS} value={p.customers} onChange={(v) => set("customers", v as string[])} />
            {step === 2 && (
              <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => next(3)}>
                {L("Neste", "Next")}
              </button>
            )}
          </Ask>
        )}

        {step >= 3 && (
          <Ask>
            <p className="bubble">{L("Hva er viktigst for deg når det gjelder skatt, regnskap og rapportering? Velg gjerne flere.", "What matters most to you about tax, accounting and reporting? Pick several if you like.")}</p>
            <Chips lang={lang} name={L("Prioriteringer", "Priorities")} multi opts={PRIOS} value={p.prios} onChange={(v) => set("prios", v as string[])} />
            {step === 3 && (
              <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => next(4)}>
                {L("Neste", "Next")}
              </button>
            )}
          </Ask>
        )}

        {step >= 4 && (
          <Ask>
            <p className="bubble">{L("Hva trenger du i landet du starter i? Bankkonto og opphold avgjør ofte hva som fungerer i praksis.", "What do you need in the country? Banking and residence often decide what works in practice.")}</p>
            <Chips lang={lang} name={L("Behov i landet", "Needs in the country")} multi opts={NEEDS} value={p.needs} onChange={(v) => set("needs", v as string[])} />
            {step === 4 && (
              <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} onClick={() => next(5)}>
                {L("Neste", "Next")}
              </button>
            )}
          </Ask>
        )}

        {step >= 5 && (
          <Ask>
            <p className="bubble">{L("Hvor mye kapital kan du sette inn i selskapet ved start?", "How much capital can you put into the company at the start?")}</p>
            <Chips lang={lang} name={L("Kapital", "Capital")} opts={capitalOpts} value={p.capital} onChange={(v) => (set("capital", v as string), next(6))} />
          </Ask>
        )}
      </section>

      <aside className="side card stack" aria-label={L("Din selskapsprofil", "Your company profile")} style={{ position: "sticky", top: 16 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>{L("Din selskapsprofil", "Your company profile")}</h2>
          <span className="small muted">
            {answered} {L("av", "of")} 6
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${Math.round((answered / 6) * 100)}%` }} />
        </div>
        <dl className="facts">
          <Fact k={L("Virksomhet", "Business")} v={BUSINESS.find((b) => b.id === p.business)?.label} lang={lang} />
          <Fact k={L("Bosted", "Residence")} v={RESIDENCE.find((b) => b.id === p.residence)?.label} lang={lang} />
          <Fact k={L("E-ID", "E-ID")} list={p.eids.map((x) => EID.find((o) => o.id === x)!.label)} lang={lang} />
          <Fact k={L("Eiere", "Owners")} v={OWNERS.find((b) => b.id === p.owners)?.label} lang={lang} />
          <Fact k={L("Skatt og regnskap", "Tax and accounts")} list={p.prios.map((x) => PRIOS.find((o) => o.id === x)!.label)} lang={lang} />
          <Fact k={L("Behov i landet", "Local needs")} list={p.needs.map((x) => NEEDS.find((o) => o.id === x)!.label)} lang={lang} />
          <Fact k={L("Kapital", "Capital")} v={capitalOpts.find((b) => b.id === p.capital)?.label} lang={lang} />
        </dl>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn block" disabled={!ready || saving} onClick={submit}>
          {saving ? "…" : L("Se anbefaling", "See recommendation")}
        </button>
        <p className="tiny muted">{L("Du kan endre svarene senere. Svarene brukes bare til å sammenligne land.", "You can change your answers later. They are only used to compare countries.")}</p>
      </aside>
    </div>
  );
}

function Fact({ k, v, list, lang }: { k: string; v?: T2; list?: T2[]; lang: Lang }) {
  const text = v ? v[lang] : list && list.length ? list.map((x) => x[lang]).join(", ") : null;
  return (
    <div>
      <dt>{k}</dt>
      <dd style={text ? undefined : { fontWeight: 400, color: "var(--muted)" }}>{text ?? (lang === "nb" ? "Ikke svart" : "Not answered")}</dd>
    </div>
  );
}
