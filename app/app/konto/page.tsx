import { Shell } from "../../chrome";
import { ActionForm } from "../../components/forms";
import { changePasswordAction, deleteAccountAction, updateNameAction } from "../../auth-actions";
import { getLang, tr } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function Account({ searchParams }: { searchParams: Promise<{ slett?: string }> }) {
  const me = await requireUser();
  const lang = await getLang();
  const sp = await searchParams;
  return (
    <Shell>
      <div className="stack" style={{ gap: 24, maxWidth: 620 }}>
        <h1>{tr(lang, { nb: "Konto", en: "Account" })}</h1>
        <section className="card stack">
          <h2>{tr(lang, { nb: "Navn", en: "Name" })}</h2>
          <p className="small muted">{me.email}</p>
          <ActionForm action={updateNameAction} submit={tr(lang, { nb: "Lagre", en: "Save" })}>
            <div className="grid2">
              <label className="field">
                {tr(lang, { nb: "Fornavn", en: "First name" })}
                <input type="text" name="first_name" defaultValue={me.first_name} />
              </label>
              <label className="field">
                {tr(lang, { nb: "Etternavn", en: "Last name" })}
                <input type="text" name="last_name" defaultValue={me.last_name} />
              </label>
            </div>
          </ActionForm>
        </section>
        <section className="card stack">
          <h2>{me.has_password ? tr(lang, { nb: "Bytt passord", en: "Change password" }) : tr(lang, { nb: "Lag passord", en: "Create a password" })}</h2>
          <ActionForm action={changePasswordAction} submit={tr(lang, { nb: "Lagre passord", en: "Save password" })}>
            {me.has_password && (
              <label className="field">
                {tr(lang, { nb: "Nåværende passord", en: "Current password" })}
                <input type="password" name="current" autoComplete="current-password" required />
              </label>
            )}
            <label className="field">
              {tr(lang, { nb: "Nytt passord", en: "New password" })}
              <input type="password" name="password" autoComplete="new-password" minLength={10} required />
            </label>
          </ActionForm>
        </section>
        <section className="card stack">
          <h2>{tr(lang, { nb: "Slett kontoen", en: "Delete account" })}</h2>
          <p className="small muted">{tr(lang, { nb: "Kontoen og alle selskapssakene dine slettes for godt.", en: "Your account and all your company cases are deleted permanently." })}</p>
          {sp.slett === "feil" && <p className="alert error">{tr(lang, { nb: "E-posten stemte ikke.", en: "The email did not match." })}</p>}
          {sp.slett === "eier" && <p className="alert error">{tr(lang, { nb: "Hovedadministratoren kan ikke slettes her.", en: "The main administrator cannot be deleted here." })}</p>}
          <form action={deleteAccountAction} className="stack">
            <label className="field">
              {tr(lang, { nb: "Skriv e-posten din for å bekrefte", en: "Type your email to confirm" })}
              <input type="email" name="confirm" required />
            </label>
            <button className="btn danger" type="submit" style={{ alignSelf: "flex-start" }}>
              {tr(lang, { nb: "Slett kontoen", en: "Delete account" })}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
