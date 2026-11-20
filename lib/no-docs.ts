// Stiftelsesdokument, vedtekter og aksjeeierbok for norsk AS.
// Bygger på aksjeloven § 2-2 (minstekrav til vedtekter) og § 2-3 (stiftelsesdokumentet),
// og på Brønnøysundregistrenes eksempel på stiftelsesdokument for AS.
// Fødselsnummer lagres aldri i appen: feltet står tomt i dokumentet og fylles ut for hånd eller i Altinn.

export const MIN_CAPITAL = 30000;
export const BRREG_FEE = 6825; // digital registrering 2026

export type Founder = { name: string; address: string; orgnr: string; shares: number };

export type DocData = {
  name: string;
  kommune: string;
  address: string;
  purpose: string;
  shareCapital: number;
  shares: number;
  sharePrice: number; // beløp som betales per aksje (kan være over pålydende)
  founders: Founder[];
  payDeadline: string;
  chair: string;
  boardMembers: string[];
  deputy: string;
  ceo: string;
  auditor: string; // tom = selskapet skal ikke ha revisor
  otherCosts: number;
  place: string;
};

export const EMPTY_DOC: DocData = {
  name: "",
  kommune: "",
  address: "",
  purpose: "",
  shareCapital: MIN_CAPITAL,
  shares: 100,
  sharePrice: 300,
  founders: [{ name: "", address: "", orgnr: "", shares: 100 }],
  payDeadline: "",
  chair: "",
  boardMembers: [],
  deputy: "",
  ceo: "",
  auditor: "",
  otherCosts: 0,
  place: "",
};

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, def = 0) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : def;
};

export function cleanDocData(raw: unknown): DocData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const founders = Array.isArray(r.founders) ? r.founders.slice(0, 20) : EMPTY_DOC.founders;
  return {
    name: str(r.name, 120),
    kommune: str(r.kommune, 80),
    address: str(r.address, 200),
    purpose: str(r.purpose, 1000),
    shareCapital: int(r.shareCapital, EMPTY_DOC.shareCapital),
    shares: int(r.shares, EMPTY_DOC.shares),
    sharePrice: int(r.sharePrice, EMPTY_DOC.sharePrice),
    founders: founders.map((f) => {
      const o = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
      return { name: str(o.name, 120), address: str(o.address, 200), orgnr: str(o.orgnr, 20).replace(/\D/g, ""), shares: int(o.shares) };
    }),
    payDeadline: str(r.payDeadline, 10),
    chair: str(r.chair, 120),
    boardMembers: Array.isArray(r.boardMembers) ? r.boardMembers.map((b) => str(b, 120)).filter(Boolean).slice(0, 10) : [],
    deputy: str(r.deputy, 120),
    ceo: str(r.ceo, 120),
    auditor: str(r.auditor, 120),
    otherCosts: int(r.otherCosts),
    place: str(r.place, 80),
  };
}

export const nominal = (d: DocData) => (d.shares > 0 ? d.shareCapital / d.shares : 0);
export const totalPaid = (d: DocData) => d.shares * d.sharePrice;
export const premium = (d: DocData) => totalPaid(d) - d.shareCapital;

// Kontrollerer at dokumentet oppfyller lovens minstekrav før det kan skrives ut
export function docProblems(d: DocData, lang: "nb" | "en"): string[] {
  const L = (nb: string, en: string) => (lang === "nb" ? nb : en);
  const out: string[] = [];
  if (!d.name) out.push(L("Foretaksnavn mangler.", "Company name is missing."));
  else if (!/\s(AS|aksjeselskap)$/i.test(d.name)) out.push(L("Foretaksnavnet må slutte med «AS» eller «aksjeselskap».", "The company name must end with «AS» or «aksjeselskap»."));
  if (!d.kommune) out.push(L("Forretningskommune mangler (aksjeloven § 2-2).", "Business municipality is missing (s. 2-2)."));
  if (!d.purpose) out.push(L("Virksomhet (formål) mangler (aksjeloven § 2-2).", "Business purpose is missing (s. 2-2)."));
  if (d.shareCapital < MIN_CAPITAL) out.push(L(`Aksjekapitalen må være minst ${MIN_CAPITAL.toLocaleString("nb-NO")} kr.`, `Share capital must be at least NOK ${MIN_CAPITAL.toLocaleString("en-GB")}.`));
  if (d.shares < 1) out.push(L("Antall aksjer må være minst 1.", "There must be at least 1 share."));
  else if (d.shareCapital % d.shares !== 0) out.push(L("Aksjekapitalen må kunne deles likt på antall aksjer (hver aksje må ha samme pålydende).", "Share capital must divide evenly by the number of shares (equal nominal value)."));
  if (d.sharePrice < nominal(d)) out.push(L("Beløpet per aksje kan ikke være lavere enn pålydende.", "The price per share cannot be below nominal value."));
  const valid = d.founders.filter((f) => f.name);
  if (!valid.length) out.push(L("Minst én stifter må fylles ut.", "At least one founder is required."));
  if (valid.some((f) => !f.address)) out.push(L("Alle stiftere må ha adresse (aksjeloven § 2-3).", "All founders need an address (s. 2-3)."));
  const sum = valid.reduce((a, f) => a + f.shares, 0);
  if (valid.length && sum !== d.shares) out.push(L(`Stifterne tegner ${sum} aksjer, men selskapet har ${d.shares}.`, `Founders subscribe ${sum} shares, but the company has ${d.shares}.`));
  if (!d.chair) out.push(L("Styreleder mangler.", "Chair of the board is missing."));
  if (!d.payDeadline) out.push(L("Frist for innbetaling mangler.", "Payment deadline is missing."));
  return out;
}
