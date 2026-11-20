import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "../../../chrome";
import { Advice } from "../../advice";
import { chooseCountryAction, deleteCaseAction } from "../../actions";
import { aiEnabled } from "@/lib/ai";
import { getCase } from "@/lib/cases";
import { CHECKED } from "@/lib/countries";
import { dateFmt, getLang, tr, type Lang } from "@/lib/i18n";
import { recommend, type Note, type Result } from "@/lib/recommend";
import { costT2, rateNote } from "@/lib/money-view";
import { getCurrency } from "@/lib/prefs";
import { getRates } from "@/lib/rates";
import { requireUser } from "@/lib/session";

const ICON: Record<Note["kind"], string> = { plus: "+", minus: "!", block: "×", info: "i" };

function Notes({ notes, lang }: { notes: Note[]; lang: Lang }) {
  if (!notes.length) return null;
  return (
    <ul className="notes">
      {notes.map((n, i) => (
        <li key={i}>
          <span className={`ic ${n.kind}`} aria-hidden="true">
            {ICON[n.kind]}
          </span>
          <span>{tr(lang, n.text)}</span>
        </li>
      ))}
    </ul>
  );
}

function CountryCard({ r, lang, caseId, top, chosen, cost }: { r: Result; lang: Lang; caseId: number; top: boolean; chosen: boolean; cost: string }) {
  const c = r.country;
  return (
    <article className={`card stack${top ? " pick" : ""}`} style={{ gap: 14 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>
            {tr(lang, c.name)} · {c.form}
          </h2>
          <p className="small muted">{tr(lang, c.formLong)}</p>
        </div>
        <span className={`badge ${r.blocked ? "warn" : top ? "accent" : ""}`}>
          {r.blocked ? tr(lang, { nb: "Krever mye kapital", en: "High capital need" }) : top ? tr(lang, { nb: "Anbefalt", en: "Recommended" }) : `${r.score}/100`}
        </span>
      </div>
      <dl className="facts">
        <div><dt>{tr(lang, { nb: "Startkostnad", en: "Start-up cost" })}</dt><dd>{cost}</dd></div>
        <div><dt>{tr(lang, { nb: "Selskapsskatt", en: "Corporate tax" })}</dt><dd>{tr(lang, c.corpTax)}</dd></div>
        <div><dt>{tr(lang, { nb: "Samlet skatt på utbytte", en: "Total dividend tax" })}</dt><dd>{tr(lang, c.divTotal)}</dd></div>
        <div><dt>{tr(lang, { nb: "Formuesskatt", en: "Wealth tax" })}</dt><dd>{c.wealthTax ? tr(lang, { nb: "Ja", en: "Yes" }) : tr(lang, { nb: "Nei", en: "No" })}</dd></div>
        <div><dt>{tr(lang, { nb: "Stiftelse", en: "Formation" })}</dt><dd>{tr(lang, c.digitalText)}</dd></div>
        <div><dt>{tr(lang, { nb: "Tid", en: "Time" })}</dt><dd>{tr(lang, c.timeline)}</dd></div>
        <div><dt>{tr(lang, { nb: "Rapportering", en: "Reporting" })}</dt><dd>{tr(lang, c.reporting)}</dd></div>
      </dl>
      <Notes notes={r.notes} lang={lang} />
      <form action={chooseCountryAction} style={{ marginTop: "auto" }}>
        <input type="hidden" name="case" value={caseId} />
        <input type="hidden" name="country" value={c.code} />
        <button className={`btn block${top ? "" : " secondary"}`} type="submit">
          {chosen ? tr(lang, { nb: "Valgt – se planen", en: "Chosen – see the plan" }) : `${tr(lang, { nb: "Velg", en: "Choose" })} ${tr(lang, c.name)} ${c.form}`}
        </button>
      </form>
    </article>
  );
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = await getCase(me.id, Number((await params).id));
  if (!c) notFound();
  const lang = await getLang();
  const [cur, rates] = await Promise.all([getCurrency(lang), getRates()]);
  const cost = (x: Parameters<typeof costT2>[0]) => costT2(x, cur, rates);
  const results = recommend(c.profile, cost);
  const top = results.slice(0, 3);
  const rest = results.slice(3);
  return (
    <Shell>
      <div className="stack" style={{ gap: 24 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1>{tr(lang, { nb: "Landene som passer best for deg", en: "The countries that fit you best" })}</h1>
            <p className="muted">
              {tr(lang, { nb: "Tallene gjelder 2026 og ble sist kontrollert", en: "Figures apply to 2026 and were last checked" })} {dateFmt(lang, CHECKED)}. {rateNote(lang, cur, rates)}
            </p>
          </div>
          <Link className="btn secondary" href={`/app/sak/${c.id}/rediger`}>
            {tr(lang, { nb: "Endre svarene", en: "Change answers" })}
          </Link>
        </div>
        {aiEnabled() && (
          <Advice
            caseId={c.id}
            initial={c.ai_advice_lang === `${lang}:${cur}` ? c.ai_advice : null}
            labels={{
              title: tr(lang, { nb: "AI-rådgiverens vurdering", en: "The AI advisor's view" }),
              ask: tr(lang, { nb: "Forklar anbefalingen", en: "Explain the recommendation" }),
              busy: tr(lang, { nb: "Skriver …", en: "Writing …" }),
            }}
          />
        )}
        <div className="cards">
          {top.map((r, i) => (
            <CountryCard key={r.country.code} r={r} lang={lang} caseId={c.id} top={i === 0 && !r.blocked} chosen={c.country === r.country.code} cost={tr(lang, cost(r.country))} />
          ))}
        </div>
        <section className="stack">
          <h2>{tr(lang, { nb: "Andre land", en: "Other countries" })}</h2>
          <div className="cards">
            {rest.map((r) => (
              <CountryCard key={r.country.code} r={r} lang={lang} caseId={c.id} top={false} chosen={c.country === r.country.code} cost={tr(lang, cost(r.country))} />
            ))}
          </div>
        </section>
        <p className="tiny muted">
          {tr(lang, {
            nb: "Start my company gir ikke juridisk eller skattemessig rådgivning. Kontroller viktige valg med advokat, revisor eller regnskapsfører.",
            en: "Start my company does not give legal or tax advice. Check important decisions with a lawyer, auditor or accountant.",
          })}
        </p>
        <form action={deleteCaseAction} className="no-print">
          <input type="hidden" name="case" value={c.id} />
          <button className="btn danger" type="submit">
            {tr(lang, { nb: "Slett denne saken", en: "Delete this case" })}
          </button>
        </form>
      </div>
    </Shell>
  );
}
