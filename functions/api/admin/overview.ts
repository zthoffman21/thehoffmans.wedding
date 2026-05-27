import { json, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {

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
    `SELECT s.id, s.party_id, p.display_name AS party_name, strftime('%Y-%m-%dT%H:%M:%SZ', s.submitted_at) AS submitted_at
     FROM rsvp_submissions s
     JOIN parties p ON p.id = s.party_id
     WHERE s.submitted_at >= datetime('now','-7 days')
     ORDER BY s.submitted_at DESC
     LIMIT 10`
  ).all<{ id: string; party_id: string; party_name: string; submitted_at: string }>();

  // member_attendance_current has member_id as PRIMARY KEY so it always reflects the latest
  // RSVP per member — double submissions are automatically deduped at the data layer.
  const attendance = await env.DB.prepare(
    `SELECT
       COUNT(m.id) AS total,
       SUM(CASE WHEN a.attending_ceremony = 1 OR a.attending_reception = 1 THEN 1 ELSE 0 END) AS coming,
       SUM(CASE WHEN a.member_id IS NOT NULL
                AND NOT (a.attending_ceremony IS NULL AND a.attending_reception IS NULL)
                AND COALESCE(a.attending_ceremony, 0) != 1
                AND COALESCE(a.attending_reception, 0) != 1
                THEN 1 ELSE 0 END) AS declined,
       SUM(CASE WHEN a.member_id IS NULL
                OR (a.attending_ceremony IS NULL AND a.attending_reception IS NULL)
                THEN 1 ELSE 0 END) AS no_response,
       SUM(CASE WHEN a.attending_ceremony = 1 THEN 1 ELSE 0 END) AS attending_ceremony,
       SUM(CASE WHEN a.attending_reception = 1 THEN 1 ELSE 0 END) AS attending_reception
     FROM members m
     LEFT JOIN member_attendance_current a ON a.member_id = m.id`
  ).first<{
    total: number;
    coming: number;
    declined: number;
    no_response: number;
    attending_ceremony: number;
    attending_reception: number;
  }>();

  return json({
    counts: {
      parties: parties?.c ?? 0,
      members: members?.c ?? 0,
      submissions: submissions?.c ?? 0,
    },
    recentSubmissions: recent.results ?? [],
    attendance: {
      total: attendance?.total ?? 0,
      coming: attendance?.coming ?? 0,
      declined: attendance?.declined ?? 0,
      no_response: attendance?.no_response ?? 0,
      attending_ceremony: attendance?.attending_ceremony ?? 0,
      attending_reception: attendance?.attending_reception ?? 0,
    },
  });
};
