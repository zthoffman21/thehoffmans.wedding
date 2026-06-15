/// <reference types="@cloudflare/workers-types" />
import { type Env } from "../../_utils";

/* ---------------- Excel-friendly CSV helpers ---------------- */
function csvEscapeCell(s: string): string {
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCSV(headers: string[], rows: Array<Record<string, unknown>>): string {
    const head = headers.join(",") + "\r\n";
    const body = rows
        .map((row) => headers.map((h) => csvEscapeCell(String(row[h] ?? ""))).join(","))
        .join("\r\n");
    return head + body + "\r\n";
}
function asYesNo(b: unknown) {
    if (b === null || b === undefined) return "";
    return b ? "Yes" : "No";
}
function asExcelText(s: unknown) {
    if (s === null || s === undefined) return "";
    return `="${String(s)}"`; // keep exactly as typed (phones, ids)
}

type LatestExportRow = {
    party_name: string;
    member_name: string;
    contact_email: string | null;
    contact_phone: string | null;
    reminder_opt_in: number | null;
    attending_ceremony: number | null;
    attending_reception: number | null;
    dietary: string | null;
    notes: string | null;
};

/* ---------------- Export handler ---------------- */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        const sqlLatest = `
      WITH ranked AS (
        SELECT
          s.id                AS submission_id,
          s.party_id,
          s.contact_email,
          s.contact_phone,
          s.reminder_opt_in,
          ROW_NUMBER() OVER (
            PARTITION BY s.party_id
            ORDER BY s.submitted_at DESC, s.id DESC
          ) AS rn
        FROM rsvp_submissions s
      )
      SELECT
        p.id           AS party_id,
        p.display_name AS party_name,
        r.submission_id,
        m.id            AS member_id,
        m.full_name     AS member_name,
        COALESCE(p.contact_email, r.contact_email) AS contact_email,
        COALESCE(p.contact_phone, r.contact_phone) AS contact_phone,
        COALESCE(p.reminder_opt_in, r.reminder_opt_in, 0) AS reminder_opt_in,
        a.attending_ceremony,
        a.attending_reception,
        a.dietary,
        a.notes
      FROM ranked r
      JOIN parties p ON p.id = r.party_id
      JOIN members m ON m.party_id = p.id
      LEFT JOIN member_attendance_current a ON a.member_id = m.id
      WHERE r.rn = 1
      ORDER BY p.display_name, m.sort_order, m.full_name;
    `;
        const { results: latest } = await env.DB.prepare(sqlLatest).all<LatestExportRow>();

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
        ] as const;

        const rows: Record<(typeof headers)[number], string>[] = [];

        for (const r of latest ?? []) {
            rows.push({
                "Party Name": r.party_name,
                "Member Name": r.member_name,
                Phone: asExcelText(r.contact_phone),
                Email: r.contact_email ?? "",
                "Email Reminders": asYesNo(r.reminder_opt_in),
                "Attending Ceremony": asYesNo(r.attending_ceremony),
                "Attending Reception": asYesNo(r.attending_reception),
                Dietary: r.dietary ?? "",
                Notes: r.notes ?? "",
            });
        }

        const csvCore = rowsToCSV(headers as unknown as string[], rows);
        const BOM = "\uFEFF";
        const stamp = new Date().toISOString().slice(0, 10);

        return new Response(BOM + csvCore, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="latest_rsvps_${stamp}.csv"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err: unknown) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
