import { Pool } from "pg";
import { hashPassword, verifyPassword } from "./password";

// Én felles tilkoblingspool per serverprosess.
// DATABASE_URL settes i Render (Neon: bruk «pooled connection string» med sslmode=require).
declare global {
  // eslint-disable-next-line no-var
  var __smcPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __smcReady: Promise<void> | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL mangler");
  const local = /localhost|127\.0\.0\.1/.test(url);
  const parsed = new URL(url);
  const channelBinding = parsed.searchParams.get("channel_binding") === "require";
  parsed.searchParams.delete("channel_binding");
  console.log(`Database: kobler til ${parsed.hostname}${parsed.pathname}`);
  return new Pool({
    connectionString: parsed.toString(),
    enableChannelBinding: channelBinding,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: local ? undefined : { rejectUnauthorized: true },
  });
}

function pool(): Pool {
  if (!globalThis.__smcPool) globalThis.__smcPool = makePool();
  return globalThis.__smcPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  google_sub TEXT UNIQUE,
  lang TEXT NOT NULL DEFAULT 'nb',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
-- En «sak» er ett selskap brukeren holder på å starte: intervjusvar, valgt land og dokumentdata
CREATE TABLE IF NOT EXISTS cases (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  country TEXT,
  form TEXT,
  doc_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_advice TEXT,
  ai_advice_lang TEXT,
  status TEXT NOT NULL DEFAULT 'interview' CHECK (status IN ('interview','compared','documents','done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cases_user_idx ON cases(user_id, updated_at DESC);
-- Bruk av Claude: hvem, til hva og hvor mye (ingen innhold lagres)
CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT,
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function bootstrap() {
  const p = pool();
  await p.query(SCHEMA);
  // Hovedadministrator fra miljøvariablene. Endres passordet, logges hen ut av alle enheter.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const pw = process.env.ADMIN_PASSWORD;
  if (email && pw && pw.length >= 10) {
    const { rows } = await p.query("SELECT id, password_hash FROM users WHERE email = $1", [email]);
    if (!rows[0]) {
      await p.query("INSERT INTO users (email, password_hash, role, is_owner) VALUES ($1, $2, 'admin', TRUE)", [email, await hashPassword(pw)]);
    } else {
      const same = rows[0].password_hash ? await verifyPassword(pw, rows[0].password_hash) : false;
      if (!same) {
        await p.query("UPDATE users SET password_hash = $2 WHERE id = $1", [rows[0].id, await hashPassword(pw)]);
        await p.query("DELETE FROM sessions WHERE user_id = $1", [rows[0].id]);
      }
      await p.query("UPDATE users SET role = 'admin', is_owner = TRUE WHERE id = $1", [rows[0].id]);
    }
  }
}

export async function db(): Promise<Pool> {
  if (!globalThis.__smcReady) {
    globalThis.__smcReady = bootstrap().catch((e) => {
      globalThis.__smcReady = undefined;
      throw e;
    });
  }
  await globalThis.__smcReady;
  return pool();
}

export async function audit(actor: string | null, action: string, target?: string) {
  try {
    const p = await db();
    await p.query("INSERT INTO audit_log (actor, action, target) VALUES ($1, $2, $3)", [actor, action, target ?? null]);
  } catch (e) {
    console.error("Kunne ikke skrive til loggen", e);
  }
}
