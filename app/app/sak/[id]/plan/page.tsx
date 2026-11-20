import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Shell } from "../../../../chrome";
import { markDoneAction } from "../../../actions";
import { getCase } from "@/lib/cases";
import { CHECKED, countryByCode } from "@/lib/countries";
import { dateFmt, getLang, tr } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = await getCase(me.id, Number((await params).id));
  if (!c) notFound();
  const country = countryByCode(c.country);
  if (!country) redirect(`/app/sak/${c.id}`);
  const lang = await getLang();
  const isNO = country.code === "NO";
  return (
    <Shell>
      <div className="layout-2">
        <div className="main stack" style={{ gap: 22 }}>
          <div className="stack" style={{ gap: 6 }}>
            <p className="small">
              <Link href={`/app/sak/${c.id}`}>← {tr(lang, { nb: "Tilbake til sammenligningen", en: "Back to the comparison" })}</Link>
            </p>
            <h1>
              {tr(lang, { nb: "Plan:", en: "Plan:" })} {tr(lang, country.name)} {country.form}
            </h1>
            <p className="muted">{tr(lang, country.formLong)}</p>
          </div>
          {c.status === "done" && <p className="alert ok">{tr(lang, { nb: "Du har markert selskapet som startet. Gratulerer!", en: "You have marked the company as started. Congratulations!" })}</p>}
          {isNO && (
            <div className="card stack" style={{ gap: 10, borderColor: "var(--accent)" }}>
              <h2>{tr(lang, { nb: "Dokumentene dine", en: "Your documents" })}</h2>
              <p className="muted">{tr(lang, { nb: "Lag stiftelsesdokument, vedtekter og aksjeeierbok etter aksjeloven §§ 2-2 og 2-3, klare til signering.", en: "Create the memorandum, articles and shareholder register under the Limited Liability Companies Act ss. 2-2 and 2-3, ready to sign." })}</p>
              <Link className="btn" href={`/app/sak/${c.id}/dokumenter`} style={{ alignSelf: "flex-start" }}>
                {tr(lang, { nb: "Lag dokumentene", en: "Create the documents" })}
              </Link>
            </div>
          )}
          <section className="stack">
            <h2>{tr(lang, { nb: "Steg for steg", en: "Step by step" })}</h2>
            <ol className="stack" style={{ paddingLeft: 22, margin: 0, gap: 10 }}>
              {country.steps.map((s, i) => (
                <li key={i}>{tr(lang, s)}</li>
              ))}
            </ol>
          </section>
          <section className="card stack">
            <h2>{tr(lang, { nb: "Krav og praktiske forhold", en: "Requirements and practicalities" })}</h2>
            <dl className="facts">
              <div><dt>{tr(lang, { nb: "Minstekapital", en: "Minimum capital" })}</dt><dd>{tr(lang, country.minCapital)}</dd></div>
              <div><dt>{tr(lang, { nb: "Statlig gebyr", en: "State fee" })}</dt><dd>{tr(lang, country.stateFee)}</dd></div>
              <div><dt>{tr(lang, { nb: "Lokale krav", en: "Local requirements" })}</dt><dd>{tr(lang, country.localReq)}</dd></div>
              <div><dt>{tr(lang, { nb: "Bankkonto", en: "Bank account" })}</dt><dd>{tr(lang, country.bank)}</dd></div>
              <div><dt>{tr(lang, { nb: "Visum og opphold", en: "Visa and residence" })}</dt><dd>{tr(lang, country.visa)}</dd></div>
              <div><dt>{tr(lang, { nb: "Rapportering", en: "Reporting" })}</dt><dd>{tr(lang, country.reporting)}</dd></div>
              <div><dt>{tr(lang, { nb: "Arbeidsgiveravgift", en: "Employer contributions" })}</dt><dd>{tr(lang, country.employerTax)}</dd></div>
              <div><dt>{tr(lang, { nb: "Moms", en: "VAT" })}</dt><dd>{tr(lang, country.vat)}</dd></div>
            </dl>
          </section>
          <section className="stack">
            <h2>{tr(lang, { nb: "Andre selskapsformer", en: "Other company forms" })}</h2>
            <ul className="stack" style={{ paddingLeft: 20, margin: 0, gap: 6 }}>
              {country.otherForms.map((f) => (
                <li key={f.name}>
                  <strong>{f.name}:</strong> {tr(lang, f.text)}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="side stack">
          <div className="card stack">
            <h2>{tr(lang, { nb: "Kilder", en: "Sources" })}</h2>
            <ul className="stack small" style={{ paddingLeft: 18, margin: 0, gap: 6 }}>
              {country.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="tiny muted">
              {tr(lang, { nb: "Sist kontrollert", en: "Last checked" })} {dateFmt(lang, CHECKED)}.
            </p>
          </div>
          {country.partnerNeeded && (
            <p className="alert warn small">{tr(lang, { nb: "Her trenger du i praksis en lokal partner. Vi kobler deg med partnere i en senere versjon.", en: "In practice you need a local partner here. We will connect you with partners in a later version." })}</p>
          )}
          <form action={markDoneAction}>
            <input type="hidden" name="case" value={c.id} />
            <input type="hidden" name="done" value={c.status === "done" ? "0" : "1"} />
            <button className="btn secondary block" type="submit">
              {c.status === "done" ? tr(lang, { nb: "Angre «startet»", en: "Undo «started»" }) : tr(lang, { nb: "Marker som startet", en: "Mark as started" })}
            </button>
          </form>
        </aside>
      </div>
    </Shell>
  );
}
