import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Shell } from "../../../../chrome";
import { DocForm } from "../../../doc-form";
import { getCase } from "@/lib/cases";
import { getLang, tr } from "@/lib/i18n";
import { EMPTY_DOC } from "@/lib/no-docs";
import { requireUser } from "@/lib/session";

export default async function DocsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = await getCase(me.id, Number((await params).id));
  if (!c) notFound();
  if (c.country !== "NO") redirect(`/app/sak/${c.id}/plan`);
  const lang = await getLang();
  const fullName = [me.first_name, me.last_name].filter(Boolean).join(" ");
  // Første gang: fyll inn det vi vet fra før
  const started = Boolean(c.doc_data.name || c.doc_data.founders.some((f) => f.name));
  const initial = started
    ? c.doc_data
    : { ...EMPTY_DOC, purpose: c.profile.description, chair: fullName, founders: [{ ...EMPTY_DOC.founders[0], name: fullName }] };
  return (
    <Shell>
      <div className="stack" style={{ gap: 6, marginBottom: 24 }}>
        <p className="small">
          <Link href={`/app/sak/${c.id}/plan`}>← {tr(lang, { nb: "Tilbake til planen", en: "Back to the plan" })}</Link>
        </p>
        <h1>{tr(lang, { nb: "Dokumenter for norsk AS", en: "Documents for a Norwegian AS" })}</h1>
        <p className="muted">{tr(lang, { nb: "Fyll ut, så lager vi stiftelsesdokument, vedtekter og aksjeeierbok klare til signering.", en: "Fill in the form and we create the memorandum, articles and shareholder register ready to sign." })}</p>
      </div>
      <DocForm lang={lang} caseId={c.id} initial={initial} />
    </Shell>
  );
}
