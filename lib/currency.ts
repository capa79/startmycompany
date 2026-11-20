// Valuta: brukeren velger visningsvaluta uavhengig av språk.
// Kursene er oppgitt som NOK per 1 enhet av valutaen. Denne fila kan brukes både i nettleseren og på serveren.
import type { Lang, T2 } from "./i18n";

export type Cur = "NOK" | "SEK" | "DKK" | "EUR" | "GBP" | "CHF" | "PLN" | "USD" | "AED" | "PHP";
export const CURRENCIES: { code: Cur; name: T2 }[] = [
  { code: "NOK", name: { nb: "Norske kroner", en: "Norwegian krone" } },
  { code: "SEK", name: { nb: "Svenske kroner", en: "Swedish krona" } },
  { code: "DKK", name: { nb: "Danske kroner", en: "Danish krone" } },
  { code: "EUR", name: { nb: "Euro", en: "Euro" } },
  { code: "GBP", name: { nb: "Britiske pund", en: "British pound" } },
  { code: "CHF", name: { nb: "Sveitsiske franc", en: "Swiss franc" } },
  { code: "PLN", name: { nb: "Polske zloty", en: "Polish zloty" } },
  { code: "USD", name: { nb: "Amerikanske dollar", en: "US dollar" } },
  { code: "AED", name: { nb: "UAE-dirham", en: "UAE dirham" } },
  { code: "PHP", name: { nb: "Filippinske peso", en: "Philippine peso" } },
];
export const isCur = (v: unknown): v is Cur => typeof v === "string" && CURRENCIES.some((c) => c.code === v);

export type Rates = { nok: Record<Cur, number>; date: string; source: "norges-bank" | "fallback" };

// Reservekurser hvis Norges Bank ikke svarer (NOK per enhet).
// Tolletaten, 12.–25.11.2026: EUR, GBP, DKK, CHF, PLN. SEK: 29.10.–11.11.2026. USD: Tolletaten 03.08.2026.
// PHP: Nordea, juli 2026 (midtkurs). AED er bundet til USD med 3,6725 AED per USD.
export const FALLBACK: Rates = {
  nok: { NOK: 1, EUR: 10.454, GBP: 12.472, DKK: 1.3987, CHF: 11.3107, PLN: 2.374, SEK: 0.9553, USD: 9.682, AED: 9.682 / 3.6725, PHP: 0.159 },
  date: "2026-11-12",
  source: "fallback",
};

export function convert(amount: number, from: Cur, to: Cur, r: Rates): number {
  if (from === to) return amount;
  return (amount * r.nok[from]) / r.nok[to];
}

// Runder omregnede beløp så de ikke later som de er mer presise enn de er
function roundNice(n: number): number {
  const a = Math.abs(n);
  const step = a >= 100000 ? 1000 : a >= 10000 ? 100 : a >= 1000 ? 10 : 1;
  return Math.round(n / step) * step;
}

export function money(lang: Lang, cur: Cur, amount: number, approx = false): string {
  const v = approx ? roundNice(amount) : amount;
  const s = new Intl.NumberFormat(lang === "nb" ? "nb-NO" : "en-GB", { style: "currency", currency: cur, maximumFractionDigits: v < 10 ? 2 : 0, minimumFractionDigits: 0 }).format(v);
  return approx ? `${lang === "nb" ? "ca." : "approx."} ${s}` : s;
}

// Beløp oppgitt i én valuta, vist i brukerens valuta. Like valutaer vises eksakt, ellers omregnet og rundet av.
export function showAmount(lang: Lang, amount: number, from: Cur, to: Cur, r: Rates): string {
  return from === to ? money(lang, to, amount) : money(lang, to, convert(amount, from, to, r), true);
}
