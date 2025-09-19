/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../../_utils";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
    const id = String(params.id);

    const party = await env.DB.prepare(
        `SELECT id, display_name, contact_email, contact_phone, reminder_opt_in FROM parties WHERE id = ?`
    )
        .bind(id)
        .first();
    if (!party) return json({ error: "Not found" }, 404);

    // Include invite flags so the client can build invitedEvents correctly
    const members = await env.DB.prepare(
        `
SELECT m.id, m.full_name, m.is_plus_one, m.plus_one_for, m.sort_order,
       m.invite_ceremony, m.invite_reception,
       a.attending_ceremony, a.attending_reception, a.dietary, a.notes
FROM members m
LEFT JOIN member_attendance_current a ON a.member_id = m.id
WHERE m.party_id = ?
ORDER BY m.sort_order ASC, m.full_name ASC
 `
    )
        .bind(id)
        .all();

    return json({ party, members: members.results ?? [] });
};
