/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../../_utils";

export const onRequest: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = String(params.id);

  if (request.method === "PATCH") {
    const b = await request.json<any>();

    // Update members table
    await env.DB.prepare(
      `UPDATE members
       SET full_name = COALESCE(?, full_name),
           is_plus_one = ?,
           plus_one_for = ?,
           sort_order = ?,
           invite_ceremony = ?,
           invite_reception = ?
       WHERE id = ?`
    ).bind(
      b.full_name ?? null,
      Number(!!b.is_plus_one),
      b.plus_one_for ?? null,
      Number(b.sort_order ?? 0),
      Number(!!b.invite_ceremony),
      Number(!!b.invite_reception),
      id
    ).run();

    // Upsert attendance
    await env.DB.prepare(
      `INSERT INTO member_attendance_current (member_id, attending_ceremony, attending_reception, dietary, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         attending_ceremony = excluded.attending_ceremony,
         attending_reception = excluded.attending_reception,
         dietary = excluded.dietary,
         notes = excluded.notes`
    ).bind(
      id,
      b.attending_ceremony === null || b.attending_ceremony === undefined ? null : Number(b.attending_ceremony),
      b.attending_reception === null || b.attending_reception === undefined ? null : Number(b.attending_reception),
      b.dietary ?? null,
      b.notes ?? null
    ).run();

    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    await env.DB.prepare(`DELETE FROM members WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};
