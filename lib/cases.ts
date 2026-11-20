import { db } from "./db";
import { cleanProfile, type Profile } from "./profile";
import { cleanDocData, type DocData } from "./no-docs";

export type Case = {
  id: number;
  user_id: number;
  title: string;
  profile: Profile;
  country: string | null;
  form: string | null;
  doc_data: DocData;
  ai_advice: string | null;
  ai_advice_lang: string | null;
  status: "interview" | "compared" | "documents" | "done";
  created_at: Date;
  updated_at: Date;
};

const row = (r: Record<string, unknown>): Case => ({
  ...(r as unknown as Case),
  id: Number(r.id),
  user_id: Number(r.user_id),
  profile: cleanProfile(r.profile),
  doc_data: cleanDocData(r.doc_data),
});

export async function listCases(userId: number): Promise<Case[]> {
  const p = await db();
  const { rows } = await p.query("SELECT * FROM cases WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
  return rows.map(row);
}

// Henter en sak bare hvis den tilhører brukeren
export async function getCase(userId: number, id: number): Promise<Case | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const p = await db();
  const { rows } = await p.query("SELECT * FROM cases WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0] ? row(rows[0]) : null;
}

export async function createCase(userId: number, title: string, profile: Profile): Promise<number> {
  const p = await db();
  const { rows } = await p.query("INSERT INTO cases (user_id, title, profile, status) VALUES ($1, $2, $3, 'compared') RETURNING id", [
    userId,
    title.slice(0, 120),
    JSON.stringify(profile),
  ]);
  return Number(rows[0].id);
}

export async function updateCase(userId: number, id: number, patch: Partial<Pick<Case, "title" | "country" | "form" | "status" | "ai_advice" | "ai_advice_lang">> & { profile?: Profile; doc_data?: DocData }) {
  const sets: string[] = [];
  const vals: unknown[] = [id, userId];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    vals.push(k === "profile" || k === "doc_data" ? JSON.stringify(v) : v);
    sets.push(`${k} = $${vals.length}`);
  }
  // Nye svar i intervjuet gjør det gamle AI-rådet utdatert
  if (patch.profile) sets.push("ai_advice = NULL");
  if (!sets.length) return;
  const p = await db();
  await p.query(`UPDATE cases SET ${sets.join(", ")}, updated_at = now() WHERE id = $1 AND user_id = $2`, vals);
}

export async function deleteCase(userId: number, id: number) {
  const p = await db();
  await p.query("DELETE FROM cases WHERE id = $1 AND user_id = $2", [id, userId]);
}
