import { NextRequest, NextResponse } from "next/server";
import { audit, db } from "@/lib/db";
import { GOOGLE_COOKIE, googleEnabled, googleIdentity } from "@/lib/google-auth";
import { clientIp, createSession, safeNext } from "@/lib/session";
import { noteFail, tooManyFails } from "@/lib/rate-limit";
import { getLang } from "@/lib/i18n";

const to = (req: NextRequest, path: string) => {
  const res = NextResponse.redirect(new URL(path, req.url), 303);
  res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
  return res;
};

export async function GET(req: NextRequest) {
  if (!googleEnabled()) return to(req, "/login?google=av");
  const ip = await clientIp();
  if (tooManyFails(`ip:${ip}`)) return to(req, "/login?google=sperret");
  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return to(req, "/login?google=avbrutt");
  let saved: { state?: string; nonce?: string; verifier?: string; next?: string } = {};
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_COOKIE)?.value ?? "{}");
  } catch {}
  const code = sp.get("code");
  if (!code || !saved.state || sp.get("state") !== saved.state || !saved.nonce || !saved.verifier) return to(req, "/login?google=feil");

  const id = await googleIdentity(code, saved.verifier, saved.nonce).catch((e) => {
    console.error("Google-innlogging feilet", e);
    return null;
  });
  if (!id) {
    noteFail(`ip:${ip}`);
    return to(req, "/login?google=feil");
  }
  try {
    const p = await db();
    // Finn kontoen på Google-ID, ellers på bekreftet e-post. Nye brukere får konto automatisk.
    let { rows } = await p.query(
      "SELECT id, email, google_sub FROM users WHERE google_sub = $1 OR (google_sub IS NULL AND lower(email) = $2) ORDER BY (google_sub = $1) DESC NULLS LAST LIMIT 1",
      [id.sub, id.email]
    );
    let next = safeNext(saved.next ?? "");
    if (!rows[0]) {
      ({ rows } = await p.query(
        "INSERT INTO users (email, google_sub, first_name, last_name, lang) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, google_sub",
        [id.email, id.sub, id.givenName.slice(0, 80), id.familyName.slice(0, 80), await getLang()]
      ));
      await audit(id.email, "registrerte seg med Google");
      next = "/app/ny";
    } else if (!rows[0].google_sub) {
      await p.query("UPDATE users SET google_sub = $2 WHERE id = $1", [rows[0].id, id.sub]);
      await audit(rows[0].email, "koblet Google-konto til innlogging");
    }
    await createSession(Number(rows[0].id));
    await audit(rows[0].email, "logget inn med Google");
    return to(req, next);
  } catch (e) {
    console.error("Google-innlogging: kunne ikke opprette sesjon", e);
    return to(req, "/login?google=feil");
  }
}
