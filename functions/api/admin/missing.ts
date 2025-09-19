import { json, type Env } from "./_util";

type MemberRow = {
  member_id: string;
  full_name: string;
  party_id: string;
  display_name: string;
};

type PartyRow = {
  id: string;
  display_name: string;
  member_count: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  // Members with NO recorded attendance yet (i.e., no RSVP captured into current state)
  const membersNoRSVP = await env.DB.prepare(
    `SELECT m.id AS member_id,
            m.full_name,
            p.id AS party_id,
            p.display_name
     FROM members m
     JOIN parties p ON p.id = m.party_id
     LEFT JOIN member_attendance_current a ON a.member_id = m.id
     WHERE a.member_id IS NULL
     ORDER BY p.display_name, m.full_name
     LIMIT 500`
  ).all<MemberRow>();

  // Parties with ZERO submissions overall
  const partiesNoRSVP = await env.DB.prepare(
    `SELECT p.id,
            p.display_name,
            COUNT(m.id) AS member_count
     FROM parties p
     JOIN members m ON m.party_id = p.id
     LEFT JOIN rsvp_submissions s ON s.party_id = p.id
     GROUP BY p.id
     HAVING COUNT(s.id) = 0
     ORDER BY p.display_name
     LIMIT 500`
  ).all<PartyRow>();

  return json({
    membersNoRSVP: membersNoRSVP.results ?? [],
    partiesNoRSVP: partiesNoRSVP.results ?? [],
  });
};
