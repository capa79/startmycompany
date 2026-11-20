import Link from "next/link";
import { getLang, LANGS, tr } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";
import { logoutAction, setLangAction } from "./auth-actions";

export function Logo() {
  return (
    <span className="mark" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V8l7-5 7 5v13" />
        <path d="M10 21v-6h4v6" />
      </svg>
    </span>
  );
}

export async function Header() {
  const lang = await getLang();
  const me = await getCurrentUser().catch(() => null);
  return (
    <header className="top">
      <div className="wrap">
        <Link href={me ? "/app" : "/"} className="brand">
          <Logo />
          Start my company
        </Link>
        <nav className="nav" aria-label={tr(lang, { nb: "Hovedmeny", en: "Main menu" })}>
          {me ? (
            <>
              <Link href="/app">{tr(lang, { nb: "Mine selskaper", en: "My companies" })}</Link>
              <Link href="/app/ny">{tr(lang, { nb: "Nytt selskap", en: "New company" })}</Link>
              <Link href="/app/konto">{tr(lang, { nb: "Konto", en: "Account" })}</Link>
              {me.role === "admin" && <Link href="/admin">Admin</Link>}
              <form action={logoutAction}>
                <button className="link" type="submit">{tr(lang, { nb: "Logg ut", en: "Log out" })}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">{tr(lang, { nb: "Logg inn", en: "Log in" })}</Link>
              <Link href="/registrer" className="btn" style={{ minHeight: 40 }}>
                {tr(lang, { nb: "Kom i gang", en: "Get started" })}
              </Link>
            </>
          )}
          <form action={setLangAction} className="row" style={{ gap: 4 }}>
            {LANGS.filter((l) => l.code !== lang).map((l) => (
              <button key={l.code} className="link" type="submit" name="lang" value={l.code} lang={l.code}>
                {l.label}
              </button>
            ))}
          </form>
        </nav>
      </div>
    </header>
  );
}

export async function Footer() {
  const lang = await getLang();
  return (
    <footer className="foot">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Start my company</span>
        <span className="row" style={{ gap: 16 }}>
          <Link href="/personvern">{tr(lang, { nb: "Personvern", en: "Privacy" })}</Link>
          <Link href="/vilkar">{tr(lang, { nb: "Vilkår", en: "Terms" })}</Link>
        </span>
      </div>
    </footer>
  );
}

export async function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap">{children}</div>
      </main>
      <Footer />
    </>
  );
}
