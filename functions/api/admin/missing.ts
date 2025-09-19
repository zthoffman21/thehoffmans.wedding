import { requireAdmin, json, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const gate = await requireAdmin(request, env, 'viewer');
  if (gate instanceof Response) return gate;

  const membersNoRSVP = await env.DB.prepare(
    `SELECT m.id AS member_id, m.full_name, p.id AS party_id, p.display_name
     FROM members m
     JOIN parties p ON p.id = m.party_id
     LEFT JOIN rsvp_submissions s ON s.member_id = m.id
     WHERE s.id IS NULL
     ORDER BY p.display_name, m.full_name
     LIMIT 500`
  ).all();

  const partiesNoRSVP = await env.DB.prepare(
    `SELECT p.id, p.display_name, COUNT(m.id) AS member_count
     FROM parties p
     JOIN members m ON m.party_id = p.id
     LEFT JOIN rsvp_submissions s ON s.party_id = p.id
     GROUP BY p.id
     HAVING COUNT(s.id) = 0
     ORDER BY p.display_name
     LIMIT 500`
  ).all();

  return json({
    membersNoRSVP: membersNoRSVP.results ?? [],
    partiesNoRSVP: partiesNoRSVP.results ?? [],
  });
};
