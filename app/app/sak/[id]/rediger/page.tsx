import { notFound } from "next/navigation";
import { Shell } from "../../../../chrome";
import { Interview } from "../../../interview";
import { aiEnabled } from "@/lib/ai";
import { getCase } from "@/lib/cases";
import { getLang, tr } from "@/lib/i18n";
import { requireUser } from "@/lib/session";
import { getCurrency } from "@/lib/prefs";
import { getRates } from "@/lib/rates";

export default async function EditCase({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = await getCase(me.id, Number((await params).id));
  if (!c) notFound();
  const lang = await getLang();
  const [cur, rates] = await Promise.all([getCurrency(lang), getRates()]);
  return (
    <Shell>
      <h1 style={{ marginBottom: 24 }}>{tr(lang, { nb: "Endre svarene", en: "Change your answers" })}</h1>
      <Interview lang={lang} aiOn={aiEnabled()} caseId={c.id} initial={c.profile} cur={cur} nokPerUnit={rates.nok[cur]} />
    </Shell>
  );
}
