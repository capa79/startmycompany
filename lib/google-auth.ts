// «Logg inn med Google» (OpenID Connect, bare «openid email profile»).
// Nye brukere får konto automatisk. Settes opp med GOOGLE_CLIENT_ID og GOOGLE_CLIENT_SECRET i Render.
// Godkjent omdirigerings-URI i Google Cloud: {APP_URL}/api/auth/google/callback
import { createHash, randomBytes } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_COOKIE = "smc_g_oidc";

export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const googleRedirect = () => `${appUrl()}/api/auth/google/callback`;

export function newGoogleRequest(next: string) {
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = `${GOOGLE_AUTH_URL}?${new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirect(),
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  })}`;
  return { url, cookie: JSON.stringify({ state, nonce, verifier, next }) };
}

export type GoogleIdentity = { sub: string; email: string; givenName: string; familyName: string };

// Bytter koden mot ID-token direkte hos Google over TLS og kontrollerer innholdet
// (utsteder, mottaker, utløp, nonce og bekreftet e-post), slik OpenID Connect krever.
export async function googleIdentity(code: string, verifier: string, nonce: string): Promise<GoogleIdentity | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: googleRedirect(),
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  const parts = id_token?.split(".") ?? [];
  if (parts.length !== 3) return null;
  let c: Record<string, unknown>;
  try {
    c = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const iss = String(c.iss ?? "");
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") return null;
  if (!aud.includes(process.env.GOOGLE_CLIENT_ID)) return null;
  if (typeof c.exp !== "number" || c.exp < now - 60) return null;
  if (c.nonce !== nonce) return null;
  if (c.email_verified !== true && c.email_verified !== "true") return null;
  const email = String(c.email ?? "").trim().toLowerCase();
  const sub = String(c.sub ?? "");
  if (!email || !sub) return null;
  return { sub, email, givenName: String(c.given_name ?? ""), familyName: String(c.family_name ?? "") };
}
