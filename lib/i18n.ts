import { cookies, headers } from "next/headers";

// Språk: norsk bokmål (standard) og engelsk. Valget huskes i en informasjonskapsel.
// Tekstene står side om side i koden med tr(), så de to språkene holdes i takt.
export type Lang = "nb" | "en";
export const LANG_COOKIE = "smc_lang";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "nb", label: "Norsk" },
  { code: "en", label: "English" },
];

export const isLang = (v: unknown): v is Lang => v === "nb" || v === "en";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^(nb|nn|no|da|sv)\b/i.test(al) || al === "" ? "nb" : "en";
}

// En tekst på begge språk
export type T2 = { nb: string; en: string };
export const tr = (lang: Lang, t: T2 | string) => (typeof t === "string" ? t : t[lang]);

// Tall og beløp på riktig format
export const num = (lang: Lang, n: number) => new Intl.NumberFormat(lang === "nb" ? "nb-NO" : "en-GB").format(n);
export const dateFmt = (lang: Lang, d: Date | string) =>
  new Intl.DateTimeFormat(lang === "nb" ? "nb-NO" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Oslo" }).format(new Date(d));
