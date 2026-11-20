import { cookies } from "next/headers";
import { isCur, type Cur } from "./currency";
import { getLang, type Lang } from "./i18n";

// Visningsvaluta velges uavhengig av språk og huskes i en informasjonskapsel.
export const CUR_COOKIE = "smc_cur";

export async function getCurrency(lang?: Lang): Promise<Cur> {
  const c = (await cookies()).get(CUR_COOKIE)?.value;
  if (isCur(c)) return c;
  return (lang ?? (await getLang())) === "nb" ? "NOK" : "EUR";
}
