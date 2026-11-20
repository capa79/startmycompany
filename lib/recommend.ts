// Anbefalingsmotor: gir hvert land poeng ut fra profilen og forklarer hvorfor.
// Reglene bygger bare på fakta i countries.ts. Endrer du fakta der, følger anbefalingene med.
import { COUNTRIES, type Country } from "./countries";
import type { T2 } from "./i18n";
import { CAPITAL_MAX, type Profile } from "./profile";

export type Note = { kind: "plus" | "minus" | "block" | "info"; text: T2 };
export type Result = { country: Country; score: number; notes: Note[]; blocked: boolean };

const EEA_RES = new Set(["NO", "SE", "DK", "EEA"]);
const nok = (n: number) => ({ nb: `${new Intl.NumberFormat("nb-NO").format(n)} kr`, en: `NOK ${new Intl.NumberFormat("en-GB").format(n)}` });

function scoreCountry(c: Country, p: Profile): Result {
  const notes: Note[] = [];
  let s = 50;
  const has = (arr: string[], v: string) => arr.includes(v);
  const eea = EEA_RES.has(p.residence);

  // Digital stiftelse og e-ID
  const eidFor: Record<string, string> = { NO: "bankid_no", SE: "bankid_se", DK: "mitid", EE: "eresidency" };
  if (eidFor[c.code]) {
    if (has(p.eids, eidFor[c.code]) || (c.code === "EE" && has(p.eids, "eresidency"))) {
      s += 12;
      notes.push({ kind: "plus", text: { nb: "Du har riktig e-ID og kan stifte helt digitalt.", en: "You have the right e-ID and can form the company fully online." } });
    } else if (c.code === "EE") {
      s -= 4;
      notes.push({ kind: "info", text: { nb: "Du må først søke e-Residency (150 euro) for å stifte digitalt.", en: "You first need e-Residency (EUR 150) to form online." } });
    } else {
      s -= 12;
      notes.push({ kind: "minus", text: { nb: `Uten ${c.code === "DK" ? "MitID" : "BankID"} trenger du fullmektig eller papirløsning.`, en: `Without ${c.code === "DK" ? "MitID" : "BankID"} you need a representative or a paper filing.` } });
    }
  }
  if (c.code === "PL") {
    if (has(p.eids, "qes")) s += 6;
    else notes.push({ kind: "info", text: { nb: "S24 krever kvalifisert e-signatur eller polsk Profil Zaufany.", en: "S24 requires a qualified e-signature or Polish Profil Zaufany." } });
  }
  if (c.code === "GB") {
    s += 6;
    notes.push({ kind: "plus", text: { nb: "Helt digital stiftelse, vanligvis innen 24 timer.", en: "Fully online formation, usually within 24 hours." } });
  }

  // Krav til bosted for ledelsen
  if ((c.code === "NO" || c.code === "SE") && p.residence && !eea && !(c.code === "NO" && p.residence === "GB")) {
    s -= 18;
    notes.push({ kind: "minus", text: { nb: "Ledelsen må i hovedsak bo i EØS. Du trenger en lokal daglig leder eller styremedlemmer.", en: "Management must mainly live in the EEA. You need a local CEO or board members." } });
  }
  if (c.code === "CH" && p.residence !== "CH") {
    s -= 20;
    notes.push({ kind: "minus", text: { nb: "Krever en person med signaturrett som bor i Sveits. Det koster ofte 6 000–25 000 CHF i året via partner.", en: "Requires an authorised signatory living in Switzerland, often CHF 6,000–25,000 a year via a partner." } });
  }
  if (c.partnerNeeded && c.code !== "CH") {
    s -= 10;
    notes.push({ kind: "info", text: { nb: "I praksis trenger du en lokal partner for adresse, lisens eller kontaktperson.", en: "In practice you need a local partner for address, licence or contact person." } });
  }

  // Kapital
  const maxCap = CAPITAL_MAX[p.capital] ?? Infinity;
  if (c.code === "PH") {
    if (maxCap < 2_000_000) {
      s -= 40;
      notes.push({ kind: "block", text: { nb: "Ved mer enn 40 % utenlandsk eierskap i hjemmemarkedet kreves 200 000 USD i innbetalt kapital (100 000 USD for enkelte teknologiselskaper). Eksportselskaper er unntatt.", en: "Over 40% foreign ownership in the domestic market requires USD 200,000 paid-in capital (USD 100,000 for some tech companies). Export companies are exempt." } });
    }
  } else if (c.startCostNok !== null && maxCap < c.startCostNok) {
    s -= 20;
    notes.push({ kind: "minus", text: { nb: `Startkostnaden er ${c.startCostText.nb}, mer enn kapitalen du har oppgitt.`, en: `The start-up cost is ${c.startCostText.en}, more than the capital you stated.` } });
  }
  if (c.code === "CH" && maxCap < 238000) s -= 10;

  // Prioriteringer
  if (has(p.prios, "billig") && c.startCostNok !== null) {
    if (c.startCostNok <= 5000) s += 12;
    else if (c.startCostNok <= 15000) s += 6;
    else if (c.startCostNok > 100000) s -= 10;
  }
  if (has(p.prios, "raskt") && (c.code === "GB" || c.code === "EE" || c.code === "SE" || c.code === "PL")) s += 5;
  if (has(p.prios, "overskudd")) {
    s += Math.round((22 - c.retainedTax) / 2);
    if (c.retainedTax === 0) notes.push({ kind: "plus", text: { nb: "Ingen skatt på overskudd som blir stående i selskapet.", en: "No tax on profit kept in the company." } });
  }
  if (has(p.prios, "utbytte") && c.divTotalNum !== null) {
    s += Math.round((45 - c.divTotalNum) / 3);
    notes.push({ kind: c.divTotalNum <= 35 ? "plus" : "minus", text: { nb: `Samlet skatt på utbytte: ${c.divTotal.nb}.`, en: `Total tax on dividends: ${c.divTotal.en}.` } });
  }
  if (has(p.prios, "formue") && c.wealthTax) {
    s -= 8;
    notes.push({ kind: "minus", text: { nb: "Landet har formuesskatt.", en: "The country has a wealth tax." } });
  }
  if (has(p.prios, "engelsk") && c.english) s += 6;
  if (has(p.prios, "holdingregler")) {
    notes.push({ kind: "info", text: { nb: "Vilkårene for skattefritt utbytte mellom selskaper må sjekkes for dette landet.", en: "The conditions for tax-free dividends between companies must be checked for this country." } });
  }

  // Kunder
  if (has(p.customers, "gulf") && c.code === "AE") s += 10;
  if (has(p.customers, "asia") && c.code === "PH") s += 6;
  if ((has(p.customers, "eu") || has(p.customers, "nordic")) && ["NO", "SE", "DK", "EE", "PL"].includes(c.code)) s += 3;
  if (has(p.customers, "local") && c.code === p.residence) s += 10;
  if (c.code === "AE") notes.push({ kind: "info", text: { nb: "Frisoneselskaper kan ikke selge direkte til kunder på mainland i UAE.", en: "Free zone companies cannot sell directly to mainland UAE customers." } });

  // Hjemland gir enklest skatt og drift
  if (c.code === p.residence) {
    s += 10;
    notes.push({ kind: "plus", text: { nb: "Selskapet ligger der du bor. Det gir enklest skatt, bank og drift.", en: "The company is where you live. That makes tax, banking and operations simplest." } });
  } else if (p.residence === "NO") {
    notes.push({ kind: "info", text: { nb: "Du bor i Norge. Utbytte til deg skattlegges i Norge, og NOKUS-reglene kan gjelde for selskaper i lavskatteland.", en: "You live in Norway. Dividends to you are taxed in Norway, and CFC (NOKUS) rules may apply to low-tax countries." } });
  }

  // Behov i landet
  if (has(p.needs, "bank")) notes.push({ kind: "info", text: { nb: `Bankkonto: ${c.bank.nb}.`, en: `Bank account: ${c.bank.en}.` } });
  if (has(p.needs, "visum")) notes.push({ kind: "info", text: { nb: `Visum: ${c.visa.nb}.`, en: `Visa: ${c.visa.en}.` } });
  if (has(p.needs, "ansatte")) notes.push({ kind: "info", text: { nb: `Arbeidsgiveravgift: ${c.employerTax.nb}.`, en: `Employer contributions: ${c.employerTax.en}.` } });

  // Bransjer med særregler
  if (p.business === "invest") notes.push({ kind: "info", text: { nb: "Investering for andre kan kreve konsesjon i alle landene.", en: "Investing for others may require a licence in every country." } });

  const blocked = notes.some((n) => n.kind === "block");
  return { country: c, score: Math.max(0, Math.min(100, s)), notes, blocked };
}

export function recommend(p: Profile): Result[] {
  return COUNTRIES.map((c) => scoreCountry(c, p)).sort((a, b) => Number(a.blocked) - Number(b.blocked) || b.score - a.score);
}

export { nok };
