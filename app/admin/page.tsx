import { Shell } from "../chrome";
import { deleteUserAction, logoutUserAction, setRoleAction } from "./actions";
import { aiEnabled, AI_MODEL } from "@/lib/ai";
import { db } from "@/lib/db";
import { countryByCode } from "@/lib/countries";
import { dateFmt, getLang, tr } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  const me = await requireAdmin();
  const lang = await getLang();
  const p = await db();
  const [stats, users, cases, ai, byCountry, log] = await Promise.all([
    p.query(`SELECT (SELECT count(*) FROM users)::int AS users,
                    (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_users,
                    (SELECT count(*) FROM cases)::int AS cases,
                    (SELECT count(*) FROM cases WHERE status = 'done')::int AS done`),
    p.query(`SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_owner, u.created_at, u.last_login_at,
                    (u.google_sub IS NOT NULL) AS google, (SELECT count(*) FROM cases c WHERE c.user_id = u.id)::int AS n
               FROM users u ORDER BY u.created_at DESC LIMIT 200`),
    p.query(`SELECT c.id, c.title, c.country, c.status, c.updated_at, u.email FROM cases c JOIN users u ON u.id = c.user_id ORDER BY c.updated_at DESC LIMIT 50`),
    p.query(`SELECT feature, count(*)::int AS calls, coalesce(sum(input_tokens),0)::int AS input, coalesce(sum(output_tokens),0)::int AS output
               FROM ai_usage WHERE created_at > now() - interval '30 days' GROUP BY feature ORDER BY calls DESC`),
    p.query(`SELECT country, count(*)::int AS n FROM cases WHERE country IS NOT NULL GROUP BY country ORDER BY n DESC`),
    p.query(`SELECT actor, action, target, created_at FROM audit_log ORDER BY created_at DESC LIMIT 50`),
  ]);
  const s = stats.rows[0];
  const L = (nb: string, en: string) => tr(lang, { nb, en });
  return (
    <Shell>
      <div className="stack" style={{ gap: 28 }}>
        <h1>Admin</h1>
        <div className="cards">
          {[
            [L("Brukere", "Users"), s.users],
            [L("Nye siste 7 dager", "New last 7 days"), s.new_users],
            [L("Selskapssaker", "Company cases"), s.cases],
            [L("Markert som startet", "Marked as started"), s.done],
          ].map(([k, v]) => (
            <div key={String(k)} className="card">
              <p className="small muted">{k}</p>
              <p style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700 }}>{v}</p>
            </div>
          ))}
        </div>

        <section className="stack">
          <h2>{L("Brukere", "Users")}</h2>
          <div className="scroll">
            <table className="list">
              <thead>
                <tr>
                  <th>{L("E-post", "Email")}</th>
                  <th>{L("Navn", "Name")}</th>
                  <th>{L("Rolle", "Role")}</th>
                  <th>{L("Saker", "Cases")}</th>
                  <th>{L("Opprettet", "Created")}</th>
                  <th>{L("Sist innlogget", "Last login")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      {u.google ? " · Google" : ""}
                    </td>
                    <td>{[u.first_name, u.last_name].filter(Boolean).join(" ")}</td>
                    <td>{u.is_owner ? L("Hovedadmin", "Owner") : u.role}</td>
                    <td>{u.n}</td>
                    <td>{dateFmt(lang, u.created_at)}</td>
                    <td>{u.last_login_at ? dateFmt(lang, u.last_login_at) : "–"}</td>
                    <td>
                      {!u.is_owner && Number(u.id) !== me.id && (
                        <div className="row" style={{ gap: 6 }}>
                          <form action={setRoleAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="role" value={u.role === "admin" ? "user" : "admin"} />
                            <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                              {u.role === "admin" ? L("Fjern admin", "Remove admin") : L("Gjør til admin", "Make admin")}
                            </button>
                          </form>
                          <form action={logoutUserAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                              {L("Logg ut", "Log out")}
                            </button>
                          </form>
                          <form action={deleteUserAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="btn danger" type="submit" style={{ minHeight: 36 }}>
                              {L("Slett", "Delete")}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="layout-2">
          <section className="main stack">
            <h2>{L("Siste saker", "Latest cases")}</h2>
            <div className="scroll">
              <table className="list">
                <thead>
                  <tr>
                    <th>{L("Sak", "Case")}</th>
                    <th>{L("Bruker", "User")}</th>
                    <th>{L("Land", "Country")}</th>
                    <th>Status</th>
                    <th>{L("Oppdatert", "Updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.rows.map((c) => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.email}</td>
                      <td>{c.country ? tr(lang, countryByCode(c.country)!.name) : "–"}</td>
                      <td>{c.status}</td>
                      <td>{dateFmt(lang, c.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="side stack">
            <div className="card stack">
              <h2>{L("Valgte land", "Chosen countries")}</h2>
              {byCountry.rows.length ? (
                <ul className="stack small" style={{ margin: 0, paddingLeft: 18, gap: 4 }}>
                  {byCountry.rows.map((r) => (
                    <li key={r.country}>
                      {tr(lang, countryByCode(r.country)?.name ?? { nb: r.country, en: r.country })}: {r.n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small muted">–</p>
              )}
            </div>
            <div className="card stack">
              <h2>{L("AI siste 30 dager", "AI last 30 days")}</h2>
              <p className="small muted">{aiEnabled() ? `${L("Modell", "Model")}: ${AI_MODEL()}` : L("AI er ikke slått på (ANTHROPIC_API_KEY mangler).", "AI is off (ANTHROPIC_API_KEY missing).")}</p>
              <table className="list">
                <tbody>
                  {ai.rows.map((r) => (
                    <tr key={r.feature}>
                      <td>{r.feature}</td>
                      <td>
                        {r.calls} {L("kall", "calls")}
                      </td>
                      <td className="tiny muted">
                        {r.input + r.output} tokens
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="stack">
          <h2>{L("Logg", "Log")}</h2>
          <div className="scroll">
            <table className="list">
              <tbody>
                {log.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="tiny muted">{new Date(r.created_at).toLocaleString(lang === "nb" ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo" })}</td>
                    <td>{r.actor ?? "–"}</td>
                    <td>{r.action}</td>
                    <td>{r.target ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}
