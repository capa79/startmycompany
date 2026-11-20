import Link from "next/link";
import { Footer, Header } from "./chrome";
import { COUNTRIES, CHECKED } from "@/lib/countries";
import { dateFmt, getLang, tr } from "@/lib/i18n";

export default async function Home() {
  const lang = await getLang();
  const steps = [
    { t: { nb: "Svar på noen spørsmål", en: "Answer a few questions" }, d: { nb: "Hva selskapet skal drive med, hvor du bor, og hva som er viktig for deg om skatt, regnskap, bank og visum.", en: "What the company will do, where you live, and what matters to you about tax, accounting, banking and visas." } },
    { t: { nb: "Se hvilke land som passer", en: "See which countries fit" }, d: { nb: "Ni land sammenlignet på startkostnad, skatt, lokale krav og tid. AI-rådgiveren forklarer anbefalingen.", en: "Nine countries compared on start-up cost, tax, local requirements and time. The AI advisor explains the recommendation." } },
    { t: { nb: "Få dokumentene og planen", en: "Get the documents and plan" }, d: { nb: "Ferdig stiftelsesdokument, vedtekter og aksjeeierbok for norsk AS, og steg-for-steg-sjekkliste for alle land.", en: "Ready memorandum, articles and shareholder register for a Norwegian AS, plus step-by-step checklists for every country." } },
  ];
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="wrap stack" style={{ gap: 20 }}>
            <span className="badge">{tr(lang, { nb: "9 land · alle vanlige selskapsformer", en: "9 countries · all common company forms" })}</span>
            <h1>{tr(lang, { nb: "Start selskap i riktig land, med AI som guide", en: "Start your company in the right country, with AI as your guide" })}</h1>
            <p className="lead">
              {tr(lang, {
                nb: "Start my company finner riktig land og selskapsform for deg, viser hva det koster og hvordan du blir skattlagt, og lager dokumentene du trenger.",
                en: "Start my company finds the right country and company form for you, shows what it costs and how you are taxed, and prepares the documents you need.",
              })}
            </p>
            <div className="row">
              <Link className="btn" href="/registrer">
                {tr(lang, { nb: "Start gratis", en: "Start for free" })}
              </Link>
              <Link className="btn secondary" href="/login">
                {tr(lang, { nb: "Logg inn", en: "Log in" })}
              </Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="wrap cards">
            {steps.map((s, i) => (
              <div className="card stack" key={i} style={{ gap: 8 }}>
                <span className="badge accent" style={{ alignSelf: "flex-start" }}>
                  {i + 1}
                </span>
                <h2>{tr(lang, s.t)}</h2>
                <p className="muted">{tr(lang, s.d)}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="wrap stack">
            <h2>{tr(lang, { nb: "Landene vi dekker", en: "Countries we cover" })}</h2>
            <div className="scroll">
              <table className="list">
                <thead>
                  <tr>
                    <th>{tr(lang, { nb: "Land", en: "Country" })}</th>
                    <th>{tr(lang, { nb: "Selskapsform", en: "Company form" })}</th>
                    <th>{tr(lang, { nb: "Startkostnad", en: "Start-up cost" })}</th>
                    <th>{tr(lang, { nb: "Selskapsskatt", en: "Corporate tax" })}</th>
                    <th>{tr(lang, { nb: "Samlet skatt på utbytte", en: "Total dividend tax" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRIES.map((c) => (
                    <tr key={c.code}>
                      <td>{tr(lang, c.name)}</td>
                      <td>{c.form}</td>
                      <td>{tr(lang, c.startCostText)}</td>
                      <td>{tr(lang, c.corpTax)}</td>
                      <td>{tr(lang, c.divTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted">
              {tr(lang, { nb: "Startkostnad = minstekapital + statlig gebyr, omregnet til kroner. Sist kontrollert", en: "Start-up cost = minimum capital + state fee, converted to NOK. Last checked" })} {dateFmt(lang, CHECKED)}.{" "}
              {tr(lang, { nb: "Ikke juridisk eller skattemessig rådgivning.", en: "Not legal or tax advice." })}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
