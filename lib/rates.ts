// Henter dagens valutakurser fra Norges Banks åpne API (middelkurser, publiseres rundt kl. 16 på virkedager).
// Kursene mellomlagres i 6 timer. Svarer ikke Norges Bank, brukes reservekursene i currency.ts.
import { FALLBACK, type Cur, type Rates } from "./currency";

const FROM_NB: Cur[] = ["EUR", "USD", "SEK", "DKK", "GBP", "CHF", "PLN", "PHP"];
const URL = `https://data.norges-bank.no/api/data/EXR/B.${FROM_NB.join("+")}.NOK.SP?format=csv&lastNObservations=1&locale=en`;
const TTL = 6 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __smcRates: { at: number; rates: Rates } | undefined;
}

function parseCsv(text: string): Record<string, { value: number; date: string }> {
  const lines = text.trim().split(/\r?\n/);
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.replace(/"/g, "").trim().toUpperCase());
  const iCur = head.indexOf("BASE_CUR");
  const iVal = head.indexOf("OBS_VALUE");
  const iDate = head.indexOf("TIME_PERIOD");
  const iMult = head.indexOf("UNIT_MULT");
  const out: Record<string, { value: number; date: string }> = {};
  if (iCur < 0 || iVal < 0) return out;
  for (const line of lines.slice(1)) {
    const c = line.split(sep).map((x) => x.replace(/"/g, "").trim());
    const value = Number(c[iVal].replace(",", "."));
    const mult = iMult >= 0 ? Number(c[iMult]) || 0 : 0;
    if (Number.isFinite(value) && value > 0) out[c[iCur]] = { value: value / 10 ** mult, date: iDate >= 0 ? c[iDate] : "" };
  }
  return out;
}

export async function getRates(): Promise<Rates> {
  const hit = globalThis.__smcRates;
  if (hit && Date.now() - hit.at < TTL) return hit.rates;
  let rates: Rates = FALLBACK;
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (res.ok) {
      const got = parseCsv(await res.text());
      const nok = { ...FALLBACK.nok };
      let ok = 0;
      let date = "";
      for (const cur of FROM_NB) {
        const g = got[cur];
        // Sikkerhetssjekk: en kurs som avviker mer enn 30 % fra reservekursen er trolig feil enhet og brukes ikke
        if (g && Math.abs(g.value / FALLBACK.nok[cur] - 1) < 0.3) {
          nok[cur] = g.value;
          ok++;
          date = g.date > date ? g.date : date;
        }
      }
      nok.AED = nok.USD / 3.6725;
      if (ok >= FROM_NB.length - 1) rates = { nok, date: date || new Date().toISOString().slice(0, 10), source: "norges-bank" };
    }
  } catch (e) {
    console.error("Valutakurser: bruker reservekurser", e instanceof Error ? e.message : e);
  }
  // Ved feil prøver vi igjen om 30 minutter i stedet for 6 timer
  globalThis.__smcRates = { at: rates.source === "fallback" ? Date.now() - TTL + 30 * 60 * 1000 : Date.now(), rates };
  return rates;
}
