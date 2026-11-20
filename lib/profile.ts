// Spørsmålene i intervjuet og svaralternativene. Brukes både i nettleseren og på serveren.
import type { T2 } from "./i18n";

export type Opt = { id: string; label: T2; hint?: T2 };

export const BUSINESS: Opt[] = [
  { id: "holding", label: { nb: "Holdingselskap", en: "Holding company" }, hint: { nb: "Et holdingselskap eier aksjer i andre selskaper. I Norge gjelder fritaksmetoden for utbytte og gevinst mellom selskaper. Vilkårene for slike fritak er ulike fra land til land.", en: "A holding company owns shares in other companies. In Norway the participation exemption covers dividends and gains between companies. Conditions differ between countries." } },
  { id: "nettbutikk", label: { nb: "Nettbutikk", en: "Online store" }, hint: { nb: "Nettbutikk gir ofte moms i flere land og krav til lagerregnskap. EUs ordning for netthandel (OSS) kan forenkle momsen ved salg til forbrukere i EU.", en: "An online store often means VAT in several countries and inventory accounting. The EU One-Stop Shop (OSS) can simplify VAT on sales to EU consumers." } },
  { id: "konsulent", label: { nb: "Konsulentvirksomhet", en: "Consulting" }, hint: { nb: "Konsulentvirksomhet har lave startkostnader. Det viktigste valget er hvordan du tar ut lønn og utbytte.", en: "Consulting has low start-up costs. The key choice is how you pay yourself salary and dividends." } },
  { id: "shipping", label: { nb: "Shipping", en: "Shipping" }, hint: { nb: "Shipping kan ha egne skatteordninger, som tonnasjeskatt, og egne lisenskrav. Snakk med en spesialist før du velger land.", en: "Shipping may have special tax regimes, such as tonnage tax, and licence requirements. Talk to a specialist before choosing a country." } },
  { id: "eiendom", label: { nb: "Eiendom", en: "Real estate" }, hint: { nb: "Eiendom har egne regler for dokumentavgift og formuesverdi. Ofte legges hver eiendom i et eget selskap.", en: "Real estate has its own rules for transfer tax and wealth valuation. Each property is often held in its own company." } },
  { id: "restaurant", label: { nb: "Restaurant og servering", en: "Restaurant and hospitality" }, hint: { nb: "Servering krever ofte bevillinger og ansatte fra dag én. Lønnskostnader og arbeidsgiveravgift blir viktige.", en: "Hospitality often requires licences and staff from day one. Payroll costs and employer contributions matter." } },
  { id: "handel", label: { nb: "Import og handel", en: "Import and trade" }, hint: { nb: "Import og handel betyr toll, moms ved innførsel og ofte lagerfinansiering.", en: "Import and trade means customs, import VAT and often inventory financing." } },
  { id: "tech", label: { nb: "Teknologi og programvare", en: "Technology and software" }, hint: { nb: "Teknologiselskaper henter ofte investorer. Aksjeklasser og opsjoner bør planlegges tidlig.", en: "Tech companies often raise investment. Share classes and options should be planned early." } },
  { id: "invest", label: { nb: "Investering og trading", en: "Investment and trading" }, hint: { nb: "Investering for andre og enkelte former for trading krever konsesjon. Vi anbefaler å avklare dette før du starter.", en: "Investing for others and some forms of trading require a licence. Clarify this before you start." } },
  { id: "annet", label: { nb: "Annet", en: "Other" }, hint: { nb: "Beskriv virksomheten med egne ord, så hjelper AI-rådgiveren deg med formålsteksten.", en: "Describe the business in your own words, and the AI advisor will help with the purpose clause." } },
];

export const RESIDENCE: Opt[] = [
  { id: "NO", label: { nb: "Norge", en: "Norway" } },
  { id: "SE", label: { nb: "Sverige", en: "Sweden" } },
  { id: "DK", label: { nb: "Danmark", en: "Denmark" } },
  { id: "EEA", label: { nb: "Annet EØS-land", en: "Other EEA country" } },
  { id: "GB", label: { nb: "Storbritannia", en: "United Kingdom" } },
  { id: "CH", label: { nb: "Sveits", en: "Switzerland" } },
  { id: "AE", label: { nb: "UAE", en: "UAE" } },
  { id: "PH", label: { nb: "Filippinene", en: "Philippines" } },
  { id: "OTHER", label: { nb: "Utenfor EØS", en: "Outside the EEA" } },
];

export const EID: Opt[] = [
  { id: "bankid_no", label: { nb: "Norsk BankID", en: "Norwegian BankID" } },
  { id: "bankid_se", label: { nb: "Svensk BankID", en: "Swedish BankID" } },
  { id: "mitid", label: { nb: "Dansk MitID", en: "Danish MitID" } },
  { id: "eresidency", label: { nb: "Estisk e-Residency", en: "Estonian e-Residency" } },
  { id: "qes", label: { nb: "Kvalifisert e-signatur (EU)", en: "Qualified e-signature (EU)" } },
  { id: "none", label: { nb: "Ingen av disse", en: "None of these" } },
];

export const OWNERS: Opt[] = [
  { id: "alone", label: { nb: "Bare meg", en: "Just me" } },
  { id: "partners", label: { nb: "Meg og partnere", en: "Me and partners" } },
  { id: "company", label: { nb: "Et selskap eier", en: "A company owns it" } },
];

export const CUSTOMERS: Opt[] = [
  { id: "local", label: { nb: "I landet selskapet ligger", en: "In the company's country" } },
  { id: "nordic", label: { nb: "Norden", en: "Nordics" } },
  { id: "eu", label: { nb: "EU/EØS", en: "EU/EEA" } },
  { id: "global", label: { nb: "Hele verden", en: "Worldwide" } },
  { id: "gulf", label: { nb: "Midtøsten", en: "Middle East" } },
  { id: "asia", label: { nb: "Asia", en: "Asia" } },
];

export const PRIOS: Opt[] = [
  { id: "overskudd", label: { nb: "Lav skatt på overskudd", en: "Low tax on profit" } },
  { id: "utbytte", label: { nb: "Lav skatt på utbytte", en: "Low tax on dividends" } },
  { id: "holdingregler", label: { nb: "Skattefritt mellom selskaper", en: "Tax-free between companies" } },
  { id: "formue", label: { nb: "Unngå formuesskatt", en: "Avoid wealth tax" } },
  { id: "billig", label: { nb: "Lav startkostnad", en: "Low start-up cost" } },
  { id: "raskt", label: { nb: "Raskt i gang", en: "Quick start" } },
  { id: "enkelt", label: { nb: "Enkel regnskapsføring", en: "Simple bookkeeping" } },
  { id: "engelsk", label: { nb: "Regnskap og myndigheter på engelsk", en: "Accounts and authorities in English" } },
];

export const NEEDS: Opt[] = [
  { id: "bank", label: { nb: "Bankkonto i landet", en: "Bank account in the country" } },
  { id: "visum", label: { nb: "Visum eller opphold", en: "Visa or residence" } },
  { id: "ansatte", label: { nb: "Ansette folk lokalt", en: "Hire locally" } },
  { id: "kontor", label: { nb: "Fysisk kontor", en: "Physical office" } },
  { id: "ingen", label: { nb: "Ingenting lokalt", en: "Nothing local" } },
];

export const CAPITAL: Opt[] = [
  { id: "lt5k", label: { nb: "Under 5 000 kr", en: "Under NOK 5,000" } },
  { id: "lt30k", label: { nb: "5 000–30 000 kr", en: "NOK 5,000–30,000" } },
  { id: "lt300k", label: { nb: "30 000–300 000 kr", en: "NOK 30,000–300,000" } },
  { id: "lt2m", label: { nb: "300 000–2 mill. kr", en: "NOK 300,000–2m" } },
  { id: "gt2m", label: { nb: "Over 2 mill. kr", en: "Over NOK 2m" } },
];

export const CAPITAL_MAX: Record<string, number> = { lt5k: 5000, lt30k: 30000, lt300k: 300000, lt2m: 2000000, gt2m: Infinity };

// Kapitalvalgene er definert i NOK. Her vises grensene i brukerens valuta, avrundet til pene tall.
const EDGES: Record<string, [number, number]> = { lt5k: [0, 5000], lt30k: [5000, 30000], lt300k: [30000, 300000], lt2m: [300000, 2000000], gt2m: [2000000, Infinity] };
function nice(n: number) {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}
export function capitalLabel(id: string, lang: "nb" | "en", cur: string, nokPerUnit: number): string {
  const e = EDGES[id];
  if (!e) return id;
  if (cur === "NOK") return CAPITAL.find((c) => c.id === id)!.label[lang];
  const f = (n: number) => new Intl.NumberFormat(lang === "nb" ? "nb-NO" : "en-GB", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(nice(n / nokPerUnit));
  if (e[0] === 0) return `${lang === "nb" ? "Under" : "Under"} ${f(e[1])}`;
  if (e[1] === Infinity) return `${lang === "nb" ? "Over" : "Over"} ${f(e[0])}`;
  return `${f(e[0])}–${f(e[1])}`;
}

export type Profile = {
  business: string;
  description: string;
  residence: string;
  eids: string[];
  owners: string;
  customers: string[];
  prios: string[];
  needs: string[];
  capital: string;
};

export const EMPTY_PROFILE: Profile = { business: "", description: "", residence: "", eids: [], owners: "", customers: [], prios: [], needs: [], capital: "" };

const ids = (opts: Opt[]) => new Set(opts.map((o) => o.id));
const pick = (v: unknown, opts: Opt[]) => (typeof v === "string" && ids(opts).has(v) ? v : "");
const pickMany = (v: unknown, opts: Opt[]) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ids(opts).has(x)) : []);

// Rydder svar fra nettleseren: bare kjente verdier slipper gjennom
export function cleanProfile(raw: unknown): Profile {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    business: pick(r.business, BUSINESS),
    description: typeof r.description === "string" ? r.description.slice(0, 1000) : "",
    residence: pick(r.residence, RESIDENCE),
    eids: pickMany(r.eids, EID),
    owners: pick(r.owners, OWNERS),
    customers: pickMany(r.customers, CUSTOMERS),
    prios: pickMany(r.prios, PRIOS),
    needs: pickMany(r.needs, NEEDS),
    capital: pick(r.capital, CAPITAL),
  };
}

export const label = (opts: Opt[], id: string) => opts.find((o) => o.id === id)?.label;
