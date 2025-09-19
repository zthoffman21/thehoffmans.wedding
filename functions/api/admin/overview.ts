// functions/api/admin/overview.ts
import { requireAdmin, json, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const gate = await requireAdmin(request, env, "viewer");
  if (gate instanceof Response) return gate;

  const parties = await env.DB
    .prepare(`SELECT COUNT(*) AS c FROM parties`)
    .first<{ c: number }>();
  const members = await env.DB
    .prepare(`SELECT COUNT(*) AS c FROM members`)
    .first<{ c: number }>();
  const submissions = await env.DB
    .prepare(`SELECT COUNT(*) AS c FROM rsvp_submissions`)
    .first<{ c: number }>();

  const recent = await env.DB.prepare(
    `SELECT s.id, s.party_id, p.display_name AS party_name, s.submitted_at
     FROM rsvp_submissions s
     JOIN parties p ON p.id = s.party_id
     WHERE s.submitted_at >= datetime('now','-7 days')
     ORDER BY s.submitted_at DESC
     LIMIT 10`
  ).all<{ id: string; party_id: string; party_name: string; submitted_at: string }>();

  return json({
    counts: {
      parties: parties?.c ?? 0,
      members: members?.c ?? 0,
      submissions: submissions?.c ?? 0,
    },
    recentSubmissions: recent.results ?? [],
  });
};
