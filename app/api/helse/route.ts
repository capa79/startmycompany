import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRates } from "@/lib/rates";

// Statusside for drift: viser om databasen svarer og hvilke innstillinger som er satt.
// Viser aldri verdiene, bare om de finnes.
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD_ok: (process.env.ADMIN_PASSWORD ?? "").length >= 10,
    APP_URL: process.env.APP_URL ?? null,
    GOOGLE: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    ANTHROPIC: Boolean(process.env.ANTHROPIC_API_KEY),
  };
  let database: { ok: boolean; users?: number; error?: string };
  try {
    const p = await db();
    const { rows } = await p.query("SELECT count(*)::int AS n FROM users");
    database = { ok: true, users: rows[0].n };
  } catch (e) {
    // Feilmeldingen kortes ned og renses for eventuelle tilkoblingsadresser
    const msg = (e instanceof Error ? e.message : String(e)).replace(/postgres(ql)?:\/\/\S+/gi, "[skjult]").slice(0, 300);
    database = { ok: false, error: msg };
  }
  const r = await getRates();
  return NextResponse.json({ database, env, rates: { source: r.source, date: r.date } }, { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
