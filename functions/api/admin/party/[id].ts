/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../../_utils.js";

export const onRequest: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = String(params.id);

  if (request.method === "GET") {
    const party = await env.DB.prepare(
      `SELECT id, slug, display_name, contact_email, contact_phone, reminder_opt_in, can_rsvp, rsvp_deadline
       FROM parties WHERE id = ? LIMIT 1`
    ).bind(id).first<any>();

    if (!party) return json({ error: "not found" }, 404);

    const members = await env.DB.prepare(
      `SELECT m.id, m.party_id, m.full_name, m.is_plus_one, m.plus_one_for, m.sort_order,
              m.invite_ceremony, m.invite_reception,
              a.attending_ceremony, a.attending_reception, a.dietary, a.notes
       FROM members m
       LEFT JOIN member_attendance_current a ON a.member_id = m.id
       WHERE m.party_id = ?
       ORDER BY m.sort_order, m.full_name`
    ).bind(id).all<MemberDetail>();

    return json({ party: { ...party, members: members.results ?? [] } });
  }

  if (request.method === "PATCH") {
    const body = await request.json<any>();
    await env.DB.prepare(
      `UPDATE parties
       SET slug = COALESCE(?, slug),
           display_name = COALESCE(?, display_name),
           contact_email = ?,
           contact_phone = ?,
           reminder_opt_in = ?,
           can_rsvp = ?,
           rsvp_deadline = ?
       WHERE id = ?`
    ).bind(
      body.slug ?? null,
      body.display_name ?? null,
      body.contact_email ?? null,
      body.contact_phone ?? null,
      Number(!!body.reminder_opt_in),
      Number(!!body.can_rsvp),
      body.rsvp_deadline ?? null,
      id
    ).run();
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    await env.DB.prepare(`DELETE FROM parties WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

type MemberDetail = {
  id: string; party_id: string; full_name: string; is_plus_one: number;
  plus_one_for?: string | null; sort_order: number; invite_ceremony: number; invite_reception: number;
  attending_ceremony?: number | null; attending_reception?: number | null; dietary?: string | null; notes?: string | null;
}
