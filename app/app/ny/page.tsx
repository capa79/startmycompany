import { Shell } from "../../chrome";
import { Interview } from "../interview";
import { aiEnabled } from "@/lib/ai";
import { getLang, tr } from "@/lib/i18n";
import { EMPTY_PROFILE } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export default async function NewCase() {
  await requireUser();
  const lang = await getLang();
  return (
    <Shell>
      <div className="stack" style={{ gap: 8, marginBottom: 24 }}>
        <h1>{tr(lang, { nb: "La oss finne riktig selskap for deg", en: "Let's find the right company for you" })}</h1>
        <p className="muted">{tr(lang, { nb: "Svar på noen spørsmål. Vi bygger selskapsprofilen din mens du svarer.", en: "Answer a few questions. We build your company profile as you go." })}</p>
      </div>
      <Interview lang={lang} aiOn={aiEnabled()} caseId={null} initial={EMPTY_PROFILE} />
    </Shell>
  );
}
