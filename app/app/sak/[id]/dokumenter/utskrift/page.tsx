import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "../../../../print-button";
import { getCase } from "@/lib/cases";
import { getLang, tr } from "@/lib/i18n";
import { BRREG_FEE, docProblems, nominal, premium, totalPaid } from "@/lib/no-docs";
import { requireUser } from "@/lib/session";

// Dokumentene skrives alltid på norsk: det er det Foretaksregisteret krever.
const kr = (n: number) => `kr ${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(n)}`;
const dato = (s: string) => (s ? new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s)) : "");

export default async function PrintDocs({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = await getCase(me.id, Number((await params).id));
  if (!c) notFound();
  if (c.country !== "NO") redirect(`/app/sak/${c.id}/plan`);
  const d = c.doc_data;
  const lang = await getLang();
  if (docProblems(d, "nb").length) redirect(`/app/sak/${c.id}/dokumenter`);
  const founders = d.founders.filter((f) => f.name);
  const costs = BRREG_FEE + d.otherCosts;
  let next = 1;
  const numbering = founders.map((f) => {
    const from = next;
    next += f.shares;
    return { f, from, to: next - 1 };
  });
  return (
    <main className="page">
      <div className="wrap">
        <div className="no-print row" style={{ justifyContent: "space-between", marginBottom: 24 }}>
          <Link href={`/app/sak/${c.id}/dokumenter`}>← {tr(lang, { nb: "Tilbake til skjemaet", en: "Back to the form" })}</Link>
          <PrintButton label={tr(lang, { nb: "Skriv ut eller lagre som PDF", en: "Print or save as PDF" })} />
        </div>
        <p className="no-print alert info small" style={{ maxWidth: 760, margin: "0 auto 24px" }}>
          {tr(lang, {
            nb: "Les gjennom før signering. Fyll inn fødselsnummer for hånd. Malen bygger på aksjeloven §§ 2-2 og 2-3 og Brønnøysundregistrenes eksempel, men er ikke juridisk rådgivning.",
            en: "Read through before signing. Fill in national ID numbers by hand. The template follows the Limited Liability Companies Act ss. 2-2 and 2-3 and the Brønnøysund example, but is not legal advice.",
          })}
        </p>

        <article className="doc" lang="nb">
          <h1>Stiftelsesdokument for {d.name}</h1>

          <h2>1. Stiftere og aksjetegning</h2>
          <p>Følgende stiftere beslutter å stifte et aksjeselskap:</p>
          <table>
            <thead>
              <tr>
                <th>Navn/foretaksnavn</th>
                <th>Adresse</th>
                <th>Fødselsnr./org.nr.</th>
                <th>Antall aksjer</th>
                <th>Pålydende</th>
                <th>Sum pålydende</th>
              </tr>
            </thead>
            <tbody>
              {founders.map((f, i) => (
                <tr key={i}>
                  <td>{f.name}</td>
                  <td>{f.address}</td>
                  <td>{f.orgnr || <span className="blank" />}</td>
                  <td>{f.shares}</td>
                  <td>{kr(nominal(d))}</td>
                  <td>{kr(f.shares * nominal(d))}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <strong>Sum</strong>
                </td>
                <td>{d.shares}</td>
                <td />
                <td>{kr(d.shareCapital)}</td>
              </tr>
            </tbody>
          </table>
          <p>
            Det skal betales {kr(d.sharePrice)} per aksje, til sammen {kr(totalPaid(d))}, hvorav {kr(d.shareCapital)} er aksjekapital
            {premium(d) > 0 ? ` og ${kr(premium(d))} er overkurs` : ""}. Aksjeinnskuddet skal gjøres opp i penger og betales senest {dato(d.payDeadline)} til selskapets konto.
          </p>
          <p>Stifterne får ingen særlige rettigheter eller fordeler i forbindelse med stiftelsen.</p>
          <p>Aksjene tegnes ved at stifterne undertegner dette stiftelsesdokumentet.</p>

          <h2>2. Stiftelseskostnader</h2>
          <p>Selskapet skal dekke følgende kostnader ved stiftelsen:</p>
          <table>
            <tbody>
              <tr>
                <td>Gebyr til Brønnøysundregistrene</td>
                <td>{kr(BRREG_FEE)}</td>
              </tr>
              {d.otherCosts > 0 && (
                <tr>
                  <td>Andre kostnader</td>
                  <td>{kr(d.otherCosts)}</td>
                </tr>
              )}
              <tr>
                <td>
                  <strong>Sum anslåtte stiftelseskostnader</strong>
                </td>
                <td>
                  <strong>{kr(costs)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <h2>3. Vedtekter</h2>
          <p>Selskapet skal ha vedtekter som vedlagt. Vedtektene er en del av stiftelsesdokumentet.</p>

          <h2>4. Valg av styre og revisor</h2>
          <p>Som styre velges:</p>
          <ul>
            <li>Styreleder: {d.chair}</li>
            {d.boardMembers.map((b) => (
              <li key={b}>Styremedlem: {b}</li>
            ))}
            {d.deputy && <li>Varamedlem: {d.deputy}</li>}
          </ul>
          {d.ceo && <p>Daglig leder: {d.ceo}</p>}
          <p>{d.auditor ? `Som revisor velges: ${d.auditor}.` : "Selskapets årsregnskap skal ikke revideres, jf. aksjeloven § 7-6. Selskapet har derfor ikke revisor."}</p>

          <h2>5. Underskrift</h2>
          <p>Ved å undertegne dette dokumentet bekrefter stifterne at selskapet er stiftet. Datoen den siste stifteren signerer, er selskapets stiftelsesdato.</p>
          <div className="sign">
            {founders.map((f, i) => (
              <div key={i}>
                <span>
                  Sted og dato: {d.place ? `${d.place}, ` : ""}
                  <span className="blank" style={{ minWidth: 110 }} />
                </span>
                <span className="line">{f.name}</span>
              </div>
            ))}
          </div>

          <div className="page-break" />
          <h1>Vedtekter for {d.name}</h1>
          <p>(Vedtatt ved stiftelsen, jf. aksjeloven § 2-2)</p>
          <h2>§ 1 Foretaksnavn</h2>
          <p>Selskapets foretaksnavn er {d.name}.</p>
          <h2>§ 2 Forretningskommune</h2>
          <p>Selskapet har sitt forretningskontor i {d.kommune} kommune.</p>
          <h2>§ 3 Virksomhet</h2>
          <p>{d.purpose}</p>
          <h2>§ 4 Aksjekapital</h2>
          <p>
            Selskapets aksjekapital er {kr(d.shareCapital)}, fordelt på {d.shares} aksjer, hver pålydende {kr(nominal(d))}.
          </p>

          <div className="page-break" />
          <h1>Aksjeeierbok for {d.name}</h1>
          <p>Aksjeeierboken føres etter aksjeloven § 4-5.</p>
          <table>
            <thead>
              <tr>
                <th>Aksjeeier</th>
                <th>Fødselsnr./org.nr.</th>
                <th>Adresse</th>
                <th>Antall aksjer</th>
                <th>Aksjenummer</th>
                <th>Ervervet</th>
              </tr>
            </thead>
            <tbody>
              {numbering.map(({ f, from, to }, i) => (
                <tr key={i}>
                  <td>{f.name}</td>
                  <td>{f.orgnr || <span className="blank" style={{ minWidth: 100 }} />}</td>
                  <td>{f.address}</td>
                  <td>{f.shares}</td>
                  <td>{f.shares > 0 ? `${from}–${to}` : ""}</td>
                  <td>Ved stiftelse</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Selskapets forretningsadresse: {d.address}</p>
        </article>
      </div>
    </main>
  );
}
