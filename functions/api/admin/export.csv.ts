import { requireAdmin, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const gate = await requireAdmin(request, env, 'viewer');
  if (gate instanceof Response) return gate;

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') || 'members'; // 'members' | 'parties' | 'submissions'
  const headers = new Headers({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${scope}-export.csv"`,
    'Cache-Control': 'no-store',
  });

  let rows: any[] = [];
  if (scope === 'submissions') {
    const r = await env.DB.prepare(
      `SELECT s.id, s.submitted_at, p.display_name AS party, m.full_name AS member, s.payload_json
       FROM rsvp_submissions s
       LEFT JOIN parties p ON p.id = s.party_id
       LEFT JOIN members m ON m.id = s.member_id
       ORDER BY s.submitted_at DESC`
    ).all();
    rows = r.results ?? [];
  } else if (scope === 'parties') {
    const r = await env.DB.prepare(
      `SELECT p.id, p.slug, p.display_name, p.contact_email, p.contact_phone, p.reminder_opt_in, p.can_rsvp, p.rsvp_deadline
       FROM parties p
       ORDER BY p.display_name`
    ).all();
    rows = r.results ?? [];
  } else {
    const r = await env.DB.prepare(
      `SELECT p.display_name AS party, m.id, m.full_name, m.is_plus_one, m.plus_one_for,
              m.invite_ceremony, m.invite_reception
       FROM members m JOIN parties p ON p.id = m.party_id
       ORDER BY p.display_name, m.full_name`
    ).all();
    rows = r.results ?? [];
  }

  const encoder = new TextEncoder();
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(keys.join(',') + '\n'));
      for (const r of rows) {
        const line = keys.map(k => String(r[k] ?? '').replaceAll('"','""')).map(v =>
          v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v
        ).join(',') + '\n';
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    }
  });
  return new Response(stream, { headers });
};
