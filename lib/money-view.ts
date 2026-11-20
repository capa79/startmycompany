// Viser landenes startkostnad i brukerens valuta
import type { Country } from "./countries";
import { showAmount, type Cur, type Rates } from "./currency";
import type { Lang, T2 } from "./i18n";

export function costText(lang: Lang, c: Country, cur: Cur, r: Rates): string {
  const s = c.startCost;
  if (!s) return lang === "nb" ? "Varierer" : "Varies";
  const a = showAmount(lang, s.amount, s.cur, cur, r);
  if (s.max) {
    const b = showAmount(lang, s.max, s.cur, cur, r).replace(/^(ca\.|approx\.)\s*/, "");
    return `${a}–${b}`;
  }
  if (s.from) return `${lang === "nb" ? "Fra" : "From"} ${a.replace(/^(ca\.|approx\.)\s*/, lang === "nb" ? "ca. " : "approx. ")}`;
  return a;
}

export const costT2 = (c: Country, cur: Cur, r: Rates): T2 => ({ nb: costText("nb", c, cur, r), en: costText("en", c, cur, r) });

export function rateNote(lang: Lang, cur: Cur, r: Rates): string {
  const d = new Intl.DateTimeFormat(lang === "nb" ? "nb-NO" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(r.date));
  if (r.source === "norges-bank")
    return lang === "nb" ? `Beløp i andre valutaer er omregnet til ${cur} med Norges Banks kurs per ${d}.` : `Amounts in other currencies are converted to ${cur} at Norges Bank's rate of ${d}.`;
  return lang === "nb" ? `Beløp er omregnet til ${cur} med reservekurser (${d}). Norges Bank svarte ikke.` : `Amounts are converted to ${cur} using fallback rates (${d}). Norges Bank did not respond.`;
}
