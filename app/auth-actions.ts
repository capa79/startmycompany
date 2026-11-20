"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, db } from "@/lib/db";
import { getLang, isLang, LANG_COOKIE } from "@/lib/i18n";
import { isCur } from "@/lib/currency";
import { CUR_COOKIE } from "@/lib/prefs";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { clearFails, noteFail, tooManyFails } from "@/lib/rate-limit";
import { clientIp, createSession, destroySession, getCurrentUser, requireUser, safeNext } from "@/lib/session";

export type FormState = { error?: string; ok?: string } | null;

const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function L(nb: string, en: string) {
  return (await getLang()) === "nb" ? nb : en;
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const pw = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));
  if (!email || !pw) return { error: await L("Skriv inn e-post og passord.", "Enter your email and password.") };
  const ip = await clientIp();
  const keys = [`email:${email}`, `ip:${ip}`];
  if (tooManyFails(...keys)) return { error: await L("For mange forsøk. Vent et kvarter og prøv igjen.", "Too many attempts. Wait 15 minutes and try again.") };
  let u: { id: number; password_hash: string | null } | undefined;
  try {
    const p = await db();
    u = (await p.query("SELECT id, password_hash FROM users WHERE email = $1", [email])).rows[0];
  } catch (e) {
    console.error("Innlogging: databasefeil", e);
    return { error: await L("Får ikke kontakt med databasen akkurat nå. Prøv igjen om litt.", "Cannot reach the database right now. Try again shortly.") };
  }
  // Sjekk passord også for ukjente e-poster, så svartiden ikke avslører hvem som har konto
  const ok = await verifyPassword(pw, u?.password_hash ?? DUMMY_HASH);
  if (!u || !ok) {
    noteFail(...keys);
    await new Promise((r) => setTimeout(r, 400));
    return { error: await L("Feil e-post eller passord.", "Wrong email or password.") };
  }
  clearFails(`email:${email}`);
  await createSession(Number(u.id));
  await audit(email, "logget inn");
  redirect(next);
}

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const pw = String(form.get("password") ?? "");
  const first = String(form.get("first_name") ?? "").trim().slice(0, 80);
  const last = String(form.get("last_name") ?? "").trim().slice(0, 80);
  if (!EMAIL_RE.test(email)) return { error: await L("Skriv inn en gyldig e-postadresse.", "Enter a valid email address.") };
  const prob = passwordProblem(pw);
  if (prob) return { error: (await getLang()) === "nb" ? prob : "The password must have at least 10 characters." };
  if (form.get("terms") !== "on") return { error: await L("Du må godta vilkårene.", "You must accept the terms.") };
  const ip = await clientIp();
  if (tooManyFails(`ip:${ip}`)) return { error: await L("For mange forsøk. Prøv igjen senere.", "Too many attempts. Try again later.") };
  const p = await db();
  const hash = await hashPassword(pw);
  const { rows } = await p.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, lang) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING id",
    [email, hash, first, last, await getLang()]
  );
  if (!rows[0]) {
    noteFail(`ip:${ip}`);
    return { error: await L("Det finnes allerede en konto med denne e-posten. Logg inn i stedet.", "An account with this email already exists. Log in instead.") };
  }
  await createSession(Number(rows[0].id));
  await audit(email, "registrerte seg");
  redirect("/app/ny");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function setLangAction(form: FormData) {
  const lang = String(form.get("lang") ?? "");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  const me = await getCurrentUser().catch(() => null);
  if (me) await (await db()).query("UPDATE users SET lang = $2 WHERE id = $1", [me.id, lang]);
  revalidatePath("/", "layout");
}

export async function setCurrencyAction(form: FormData) {
  const cur = String(form.get("currency") ?? "");
  if (!isCur(cur)) return;
  (await cookies()).set(CUR_COOKIE, cur, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  const me = await getCurrentUser().catch(() => null);
  if (me) await (await db()).query("UPDATE users SET currency = $2 WHERE id = $1", [me.id, cur]);
  revalidatePath("/", "layout");
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const cur = String(form.get("current") ?? "");
  const pw = String(form.get("password") ?? "");
  const p = await db();
  const { rows } = await p.query("SELECT password_hash FROM users WHERE id = $1", [me.id]);
  if (rows[0]?.password_hash && !(await verifyPassword(cur, rows[0].password_hash))) {
    return { error: await L("Nåværende passord er feil.", "Current password is wrong.") };
  }
  const prob = passwordProblem(pw);
  if (prob) return { error: (await getLang()) === "nb" ? prob : "The password must have at least 10 characters." };
  await p.query("UPDATE users SET password_hash = $2 WHERE id = $1", [me.id, await hashPassword(pw)]);
  await audit(me.email, "byttet passord");
  return { ok: await L("Passordet er endret.", "Your password has been changed.") };
}

export async function updateNameAction(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const first = String(form.get("first_name") ?? "").trim().slice(0, 80);
  const last = String(form.get("last_name") ?? "").trim().slice(0, 80);
  await (await db()).query("UPDATE users SET first_name = $2, last_name = $3 WHERE id = $1", [me.id, first, last]);
  revalidatePath("/app", "layout");
  return { ok: await L("Lagret.", "Saved.") };
}

export async function deleteAccountAction(form: FormData) {
  const me = await requireUser();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== me.email) redirect("/app/konto?slett=feil");
  if (me.is_owner) redirect("/app/konto?slett=eier");
  await audit(me.email, "slettet kontoen sin");
  await destroySession();
  await (await db()).query("DELETE FROM users WHERE id = $1", [me.id]);
  redirect("/");
}
