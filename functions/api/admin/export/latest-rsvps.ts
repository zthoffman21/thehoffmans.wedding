/// <reference types="@cloudflare/workers-types" />
import { type Env } from "../../_utils";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCSV(headers: string[], rows: any[]): string {
  const head = headers.join(",") + "\n";
  const body = rows.map((row) => headers
    .map((h) => csvEscape((row as Record<string, unknown>)[h]))
    .join(",")
  ).join("\n");
  return head + body + "\n";
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    // --- Query (latest per party) ---
    const sql = `
      WITH ranked AS (
        SELECT
          s.id                AS submission_id,
          s.party_id,
          s.created_at,
          s.contact_email,
          s.contact_phone,
          s.notes,
          s.payload_json,
          ROW_NUMBER() OVER (
            PARTITION BY s.party_id
            ORDER BY s.created_at DESC, s.id DESC
          ) AS rn
        FROM rsvp_submissions s
      )
      SELECT
        p.id                 AS party_id,
        p.display_name,
        r.submission_id,
        r.created_at,
        r.contact_email,
        r.contact_phone,
        r.notes,
        r.payload_json
      FROM ranked r
      JOIN parties p ON p.id = r.party_id
      WHERE r.rn = 1
      ORDER BY p.display_name;
    `;
    const { results } = await env.DB.prepare(sql).all<any>();
    const headers = [
      "party_id",
      "display_name",
      "submission_id",
      "created_at",
      "contact_email",
      "contact_phone",
      "notes",
      "payload_json",
    ];

    const csv = rowsToCSV(headers, results ?? []);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="latest_rsvps.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
