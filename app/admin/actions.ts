"use server";

import { revalidatePath } from "next/cache";
import { audit, db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function setRoleAction(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get("id"));
  const role = form.get("role") === "admin" ? "admin" : "user";
  const p = await db();
  const { rows } = await p.query("SELECT email, is_owner FROM users WHERE id = $1", [id]);
  if (!rows[0] || (rows[0].is_owner && role === "user")) return;
  await p.query("UPDATE users SET role = $2 WHERE id = $1", [id, role]);
  await audit(me.email, role === "admin" ? "gjorde til admin" : "fjernet admin", rows[0].email);
  revalidatePath("/admin");
}

export async function deleteUserAction(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get("id"));
  if (id === me.id) return;
  const p = await db();
  const { rows } = await p.query("DELETE FROM users WHERE id = $1 AND is_owner = FALSE RETURNING email", [id]);
  if (rows[0]) await audit(me.email, "slettet bruker", rows[0].email);
  revalidatePath("/admin");
}

export async function logoutUserAction(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get("id"));
  const p = await db();
  await p.query("DELETE FROM sessions WHERE user_id = $1", [id]);
  await audit(me.email, "logget ut bruker overalt", String(id));
  revalidatePath("/admin");
}
