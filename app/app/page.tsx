import Link from "next/link";
import { Shell } from "../chrome";
import { listCases } from "@/lib/cases";
import { countryByCode } from "@/lib/countries";
import { dateFmt, getLang, tr } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

const STATUS = {
  interview: { nb: "Intervju", en: "Interview" },
  compared: { nb: "Sammenlignet", en: "Compared" },
  documents: { nb: "Land valgt", en: "Country chosen" },
  done: { nb: "Startet", en: "Started" },
} as const;

export default async function Dashboard() {
  const me = await requireUser();
  const lang = await getLang();
  const cases = await listCases(me.id);
  return (
    <Shell>
      <div className="stack" style={{ gap: 24 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>
            {tr(lang, { nb: "Hei", en: "Hi" })}
            {me.first_name ? `, ${me.first_name}` : ""}
          </h1>
          <Link className="btn" href="/app/ny">
            {tr(lang, { nb: "Start nytt selskap", en: "Start a new company" })}
          </Link>
        </div>
        {cases.length === 0 ? (
          <div className="card stack" style={{ alignItems: "flex-start" }}>
            <h2>{tr(lang, { nb: "Du har ingen selskaper ennå", en: "You have no companies yet" })}</h2>
            <p className="muted">{tr(lang, { nb: "Svar på noen spørsmål, så finner vi landet og selskapsformen som passer deg.", en: "Answer a few questions and we will find the country and company form that suits you." })}</p>
            <Link className="btn" href="/app/ny">
              {tr(lang, { nb: "Kom i gang", en: "Get started" })}
            </Link>
          </div>
        ) : (
          <div className="cards">
            {cases.map((c) => {
              const country = countryByCode(c.country);
              return (
                <article key={c.id} className="card stack" style={{ gap: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <h2>{c.title || tr(lang, { nb: "Nytt selskap", en: "New company" })}</h2>
                    <span className={`badge${c.status === "done" ? " good" : ""}`}>{tr(lang, STATUS[c.status])}</span>
                  </div>
                  <p className="small muted">
                    {country ? `${tr(lang, country.name)} · ${country.form}` : tr(lang, { nb: "Land ikke valgt", en: "No country chosen" })} · {tr(lang, { nb: "oppdatert", en: "updated" })} {dateFmt(lang, c.updated_at)}
                  </p>
                  <div className="row">
                    <Link className="btn secondary" href={country ? `/app/sak/${c.id}/plan` : `/app/sak/${c.id}`}>
                      {tr(lang, { nb: "Åpne", en: "Open" })}
                    </Link>
                    <Link href={`/app/sak/${c.id}`} className="small">
                      {tr(lang, { nb: "Sammenligning", en: "Comparison" })}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
