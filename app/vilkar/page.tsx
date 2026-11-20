import { Shell } from "../chrome";
import { getLang, tr } from "@/lib/i18n";

export default async function Terms() {
  const lang = await getLang();
  return (
    <Shell>
      <article className="stack" style={{ maxWidth: 720, gap: 14 }}>
        <h1>{tr(lang, { nb: "Vilkår for bruk", en: "Terms of use" })}</h1>
        <p>
          {tr(lang, {
            nb: "Start my company er et verktøy som gir veiledning, sammenligninger og dokumentmaler for å starte selskap. Tjenesten gir ikke juridisk, skattemessig eller finansiell rådgivning.",
            en: "Start my company is a tool that provides guidance, comparisons and document templates for starting a company. The service does not give legal, tax or financial advice.",
          })}
        </p>
        <p>
          {tr(lang, {
            nb: "Regler, gebyrer og skattesatser endres. Vi oppgir kilde og dato for kontroll, men du er selv ansvarlig for å kontrollere opplysningene og dokumentene før du bruker dem. Kontakt advokat, revisor eller regnskapsfører ved tvil.",
            en: "Rules, fees and tax rates change. We state the source and date checked, but you are responsible for verifying the information and documents before use. Consult a lawyer, auditor or accountant if in doubt.",
          })}
        </p>
        <p>
          {tr(lang, {
            nb: "Svar fra AI-rådgiveren lages automatisk og kan inneholde feil.",
            en: "Replies from the AI advisor are generated automatically and may contain errors.",
          })}
        </p>
      </article>
    </Shell>
  );
}
