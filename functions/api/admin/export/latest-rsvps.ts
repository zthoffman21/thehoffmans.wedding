/// <reference types="@cloudflare/workers-types" />
import { type Env } from "../../_utils";

function formatForExcel(key: string, v: unknown): string {
    if (v === null || v === undefined) return "";

    // Normalize booleans
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";

    // Normalize dates (adjust key check to your schema)
    if (key === "submitted_at") {
        try {
            const d = new Date(String(v));
            // Format as "YYYY-MM-DD HH:MM:SS" (local time)
            const pad = (n: number) => String(n).padStart(2, "0");
            const ts =
                d.getFullYear() +
                "-" +
                pad(d.getMonth() + 1) +
                "-" +
                pad(d.getDate()) +
                " " +
                pad(d.getHours()) +
                ":" +
                pad(d.getMinutes()) +
                ":" +
                pad(d.getSeconds());
            return ts;
        } catch {
            // fall through to string
        }
    }

    // Preserve IDs/phones exactly (no scientific notation, keep leading zeros)
    if (
        key.endsWith("_id") ||
        key === "party_id" ||
        key === "submission_id" ||
        key === "contact_phone"
    ) {
        const s = String(v);
        // Wrap as formula text to force Excel to keep as text
        return `="${s}"`;
    }

    return String(v);
}

function csvEscapeCell(s: string): string {
    // Quote if contains comma, quote, or newline
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCSV(headers: string[], rows: any[]): string {
    const head = headers.join(",") + "\r\n"; // CRLF for Excel
    const body = rows
        .map((row) =>
            headers
                .map((h) => csvEscapeCell(formatForExcel(h, (row as Record<string, unknown>)[h])))
                .join(",")
        )
        .join("\r\n");
    return head + body + "\r\n";
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const sql = `
      WITH ranked AS (
        SELECT
          s.id                AS submission_id,
          s.party_id,
          s.submitted_at,
          s.contact_email,
          s.contact_phone,
          s.reminder_opt_in,
          s.payload_json,
          ROW_NUMBER() OVER (
            PARTITION BY s.party_id
            ORDER BY s.submitted_at DESC, s.id DESC
          ) AS rn
        FROM rsvp_submissions s
      )
      SELECT
        p.display_name AS party_name,
        r.submitted_at,
        r.contact_email,
        r.contact_phone,
        r.reminder_opt_in,
        r.payload_json
      FROM ranked r
      JOIN parties p ON p.id = r.party_id
      WHERE r.rn = 1
      ORDER BY p.display_name;
    `;
    const { results } = await env.DB.prepare(sql).all<any>();

    const headers = [
      "Party Name",
      "Member Name",
      "Phone",
      "Email",
      "Email Reminders",
      "Attending Ceremony",
      "Attending Reception",
      "Dietary",
      "Notes",
    ];

    const rows: any[] = [];

    for (const r of results ?? []) {
      const payload = JSON.parse(r.payload_json ?? "{}");
      const members = payload.members ?? [];

      for (const m of members) {
        rows.push({
          "Party Name": r.party_name,
          "Member Name": m.full_name,
          "Phone": r.contact_phone ?? "",
          "Email": r.contact_email ?? (payload.contact?.email ?? ""),
          "Email Reminders": r.reminder_opt_in ? "Yes" : "No",
          "Attending Ceremony": m.attending?.ceremony ? "Yes" : "No",
          "Attending Reception": m.attending?.reception ? "Yes" : "No",
          "Dietary": m.dietary ?? "",
          "Notes": payload.notes ?? "",
        });
      }
    }

    const csvCore = rowsToCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    const BOM = "\uFEFF";

    return new Response(BOM + csvCore, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="latest_rsvps_${stamp}.csv"`,
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