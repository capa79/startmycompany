import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "../chrome";
import { ActionForm } from "../components/forms";
import { registerAction } from "../auth-actions";
import { GoogleButton } from "../components/google-button";
import { getLang, tr } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

export default async function RegisterPage() {
  if (await getCurrentUser().catch(() => null)) redirect("/app");
  const lang = await getLang();
  return (
    <Shell>
      <div style={{ maxWidth: 460, margin: "24px auto" }} className="stack">
        <h1>{tr(lang, { nb: "Opprett konto", en: "Create an account" })}</h1>
        <p className="muted">{tr(lang, { nb: "Gratis å bruke intervjuet og sammenligningen av land.", en: "The interview and country comparison are free to use." })}</p>
        <GoogleButton next="/app/ny" label={tr(lang, { nb: "Fortsett med Google", en: "Continue with Google" })} />
        <ActionForm action={registerAction} submit={tr(lang, { nb: "Opprett konto", en: "Create account" })}>
          <div className="grid2">
            <label className="field">
              {tr(lang, { nb: "Fornavn", en: "First name" })}
              <input type="text" name="first_name" autoComplete="given-name" />
            </label>
            <label className="field">
              {tr(lang, { nb: "Etternavn", en: "Last name" })}
              <input type="text" name="last_name" autoComplete="family-name" />
            </label>
          </div>
          <label className="field">
            {tr(lang, { nb: "E-post", en: "Email" })}
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="field">
            {tr(lang, { nb: "Passord", en: "Password" })}
            <input type="password" name="password" autoComplete="new-password" minLength={10} required />
            <span className="hint">{tr(lang, { nb: "Minst 10 tegn.", en: "At least 10 characters." })}</span>
          </label>
          <label className="row small" style={{ gap: 8 }}>
            <input type="checkbox" name="terms" required style={{ width: 20, height: 20 }} />
            <span>
              {tr(lang, { nb: "Jeg godtar", en: "I accept the" })} <Link href="/vilkar">{tr(lang, { nb: "vilkårene", en: "terms" })}</Link> {tr(lang, { nb: "og", en: "and" })}{" "}
              <Link href="/personvern">{tr(lang, { nb: "personvernerklæringen", en: "privacy policy" })}</Link>.
            </span>
          </label>
        </ActionForm>
        <p className="small muted">
          {tr(lang, { nb: "Har du konto?", en: "Already have an account?" })} <Link href="/login">{tr(lang, { nb: "Logg inn", en: "Log in" })}</Link>
        </p>
      </div>
    </Shell>
  );
}
