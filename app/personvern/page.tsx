import { Shell } from "../chrome";
import { getLang, tr } from "@/lib/i18n";

export default async function Privacy() {
  const lang = await getLang();
  const entity = process.env.LEGAL_ENTITY || "[SELSKAP]";
  const orgnr = process.env.LEGAL_ORGNR || "[ORG.NR.]";
  const contact = process.env.PRIVACY_CONTACT || "[E-POST]";
  return (
    <Shell>
      <article className="stack" style={{ maxWidth: 720, gap: 14 }}>
        <h1>{tr(lang, { nb: "Personvernerklæring", en: "Privacy policy" })}</h1>
        <p>
          {tr(lang, { nb: "Behandlingsansvarlig er", en: "The data controller is" })} {entity} ({orgnr}). {tr(lang, { nb: "Kontakt:", en: "Contact:" })} {contact}.
        </p>
        <h2>{tr(lang, { nb: "Hva vi lagrer", en: "What we store" })}</h2>
        <ul>
          <li>{tr(lang, { nb: "Konto: e-post, navn, passord (som sikker hash) og eventuell Google-ID.", en: "Account: email, name, password (as a secure hash) and Google ID if used." })}</li>
          <li>{tr(lang, { nb: "Svarene dine i intervjuet og opplysninger du fyller inn i dokumentskjemaet.", en: "Your interview answers and the details you enter in the document form." })}</li>
          <li>{tr(lang, { nb: "Fødselsnummer lagres ikke.", en: "National ID numbers are not stored." })}</li>
          <li>{tr(lang, { nb: "Logg over innlogginger og endringer, og hvor mye AI-rådgiveren brukes (ikke innholdet).", en: "A log of sign-ins and changes, and how much the AI advisor is used (not the content)." })}</li>
        </ul>
        <h2>{tr(lang, { nb: "AI-rådgiveren", en: "The AI advisor" })}</h2>
        <p>{tr(lang, { nb: "Når du ber AI-rådgiveren om hjelp, sendes svarene dine til Anthropic (Claude) for å lage svaret.", en: "When you ask the AI advisor for help, your answers are sent to Anthropic (Claude) to produce the reply." })}</p>
        <h2>{tr(lang, { nb: "Dine rettigheter", en: "Your rights" })}</h2>
        <p>{tr(lang, { nb: "Du kan når som helst slette kontoen din under Konto. Da slettes alle dataene dine.", en: "You can delete your account at any time under Account. All your data is then deleted." })}</p>
      </article>
    </Shell>
  );
}
