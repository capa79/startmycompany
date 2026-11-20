// Kall til Claude (Anthropic Messages API). Krever ANTHROPIC_API_KEY i Render.
// SMC_AI_MODEL kan overstyre modellen. Uten nøkkel virker appen, men uten AI-råd.
import { db } from "./db";

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const AI_MODEL = () => process.env.SMC_AI_MODEL || "claude-haiku-5-5";
// Hvor mange AI-kall hver bruker kan gjøre per døgn (administratorer er unntatt)
const DAILY_CAP = Number(process.env.SMC_AI_DAILY_CAP || 40);

type Opts = { system: string; prompt: string; maxTokens?: number; feature: string; userId: number | null; isAdmin?: boolean };

async function overCap(userId: number): Promise<boolean> {
  const p = await db();
  const { rows } = await p.query("SELECT count(*)::int AS n FROM ai_usage WHERE user_id = $1 AND created_at > now() - interval '1 day'", [userId]);
  return rows[0].n >= DAILY_CAP;
}

async function call(opts: Opts, extra: Record<string, unknown> = {}) {
  if (!aiEnabled()) throw new Error("AI er ikke slått på (ANTHROPIC_API_KEY mangler).");
  if (opts.userId && !opts.isAdmin && (await overCap(opts.userId))) {
    throw new Error("Du har brukt AI-rådgiveren mye det siste døgnet. Prøv igjen senere.");
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL(), max_tokens: (opts.maxTokens ?? 900) + 4000, system: opts.system, messages: [{ role: "user", content: opts.prompt }], ...extra }),
    signal: AbortSignal.timeout(60_000),
  }).catch((e) => {
    console.error("Claude: ingen kontakt", e);
    throw new Error("Fikk ikke kontakt med AI-rådgiveren. Prøv igjen.");
  });
  if (!res.ok) {
    const t = (await res.text().catch(() => "")).slice(0, 400);
    console.error("Claude-feil", res.status, t);
    if (res.status === 429 || res.status === 529) throw new Error("AI-rådgiveren er opptatt akkurat nå. Prøv igjen om litt.");
    if (res.status === 401) throw new Error("Nøkkelen til AI-rådgiveren (ANTHROPIC_API_KEY) er feil.");
    throw new Error(`AI-rådgiveren svarte ikke (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as { content?: { type: string; text?: string; name?: string; input?: unknown }[]; usage?: { input_tokens?: number; output_tokens?: number } };
  const p = await db();
  await p
    .query("INSERT INTO ai_usage (user_id, feature, model, input_tokens, output_tokens) VALUES ($1, $2, $3, $4, $5)", [
      opts.userId,
      opts.feature,
      AI_MODEL(),
      json.usage?.input_tokens ?? 0,
      json.usage?.output_tokens ?? 0,
    ])
    .catch((e) => console.error("Kunne ikke registrere AI-bruk", e));
  return json;
}

export async function askClaude(opts: Opts): Promise<string> {
  const j = await call(opts);
  return (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
}

// Svar i fast JSON-skjema via verktøykall
export async function askClaudeStructured<T>(opts: Opts & { tool: { name: string; description: string; input_schema: object } }): Promise<T | null> {
  const j = await call(opts, { tools: [opts.tool], tool_choice: { type: "auto" } });
  const hit = (j.content ?? []).find((c) => c.type === "tool_use" && c.name === opts.tool.name);
  if (hit?.input) return hit.input as T;
  const text = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1)) as T;
    } catch {}
  }
  return null;
}
