import { json, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);
  const cursor = url.searchParams.get('cursor'); // created_at string

  const where = cursor ? `WHERE s.submitted_at < ?` : ``;
  const stmt = env.DB.prepare(
    `SELECT s.id, s.party_id, s.member_id, s.payload_json, s.submitted_at,
            p.display_name AS party_name, m.full_name AS member_name
     FROM rsvp_submissions s
     LEFT JOIN parties p ON p.id = s.party_id
     LEFT JOIN members m ON m.id = s.member_id
     ${where}
     ORDER BY s.submitted_at DESC
     LIMIT ?`
  );
  const res = cursor ? await stmt.bind(cursor, limit + 1).all() : await stmt.bind(limit + 1).all();
  const rows = res.results ?? [];
  const nextCursor = rows.length > limit ? rows[limit - 1]?.submitted_at : null;

  return json({ items: rows.slice(0, limit), nextCursor });
};
