import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "../chrome";
import { ActionForm } from "../components/forms";
import { loginAction } from "../auth-actions";
import { GoogleButton } from "../components/google-button";
import { getLang, tr } from "@/lib/i18n";
import { getCurrentUser, safeNext } from "@/lib/session";

const GOOGLE_MSG: Record<string, { nb: string; en: string }> = {
  av: { nb: "Google-innlogging er ikke slått på ennå.", en: "Google sign-in is not enabled yet." },
  avbrutt: { nb: "Google-innloggingen ble avbrutt.", en: "Google sign-in was cancelled." },
  feil: { nb: "Google-innloggingen feilet. Prøv igjen.", en: "Google sign-in failed. Try again." },
  sperret: { nb: "For mange forsøk. Vent et kvarter.", en: "Too many attempts. Wait 15 minutes." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; google?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser().catch(() => null)) redirect(next);
  const lang = await getLang();
  const g = sp.google ? GOOGLE_MSG[sp.google] : null;
  return (
    <Shell>
      <div style={{ maxWidth: 420, margin: "24px auto" }} className="stack">
        <h1>{tr(lang, { nb: "Logg inn", en: "Log in" })}</h1>
        {g && <p className="alert error">{tr(lang, g)}</p>}
        <GoogleButton next={next} label={tr(lang, { nb: "Fortsett med Google", en: "Continue with Google" })} />
        <ActionForm action={loginAction} submit={tr(lang, { nb: "Logg inn", en: "Log in" })}>
          <input type="hidden" name="next" value={next} />
          <label className="field">
            {tr(lang, { nb: "E-post", en: "Email" })}
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="field">
            {tr(lang, { nb: "Passord", en: "Password" })}
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
        </ActionForm>
        <p className="small muted">
          {tr(lang, { nb: "Ny her?", en: "New here?" })} <Link href="/registrer">{tr(lang, { nb: "Opprett konto", en: "Create an account" })}</Link>
        </p>
      </div>
    </Shell>
  );
}
