/// <reference types="@cloudflare/workers-types" />
import { type Env } from "../../_utils";

/* ---------------- Excel-friendly CSV helpers ---------------- */
function csvEscapeCell(s: string): string {
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCSV(headers: string[], rows: any[]): string {
    const head = headers.join(",") + "\r\n";
    const body = rows
        .map((row) => headers.map((h) => csvEscapeCell(String(row[h] ?? ""))).join(","))
        .join("\r\n");
    return head + body + "\r\n";
}
function asYesNo(b: unknown) {
    return b ? "Yes" : "No";
}
function asExcelText(s: unknown) {
    if (s === null || s === undefined) return "";
    return `="${String(s)}"`; // keep exactly as typed (phones, ids)
}

/* ---------------- Export handler ---------------- */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    try {
        const sqlLatest = `
      WITH ranked AS (
        SELECT
          s.id                AS submission_id,
          s.party_id,
          strftime('%Y-%m-%dT%H:%M:%SZ', s.submitted_at) AS submitted_at,
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
        p.id           AS party_id,
        p.display_name AS party_name,
        r.submission_id,
        strftime('%Y-%m-%dT%H:%M:%SZ', r.submitted_at) AS submitted_at,
        r.contact_email,
        r.contact_phone,
        r.reminder_opt_in,
        r.payload_json
      FROM ranked r
      JOIN parties p ON p.id = r.party_id
      WHERE r.rn = 1
      ORDER BY p.display_name;
    `;
        const { results: latest } = await env.DB.prepare(sqlLatest).all<any>();

        // 2) Collect all memberIds referenced in those latest payloads
        const memberIds: string[] = [];
        for (const row of latest ?? []) {
            try {
                const payload = JSON.parse(row.payload_json ?? "{}");
                for (const m of payload?.members ?? []) {
                    const id = m?.memberId;
                    if (id && !memberIds.includes(id)) memberIds.push(id);
                }
            } catch {
                // ignore bad json
            }
        }

        // 3) Look up members -> full_name (and any future fields like dietary)
        const memberMap = new Map<string, { full_name: string; dietary?: string }>();
        if (memberIds.length) {
            const placeholders = memberIds.map(() => "?").join(",");
            const sqlMembers = `
        SELECT id, full_name
        FROM members
        WHERE id IN (${placeholders})
      `;
            const { results: members } = await env.DB.prepare(sqlMembers)
                .bind(...memberIds)
                .all<any>();
            for (const m of members ?? []) {
                memberMap.set(m.id, { full_name: m.full_name });
            }
        }

        // 4) Flatten rows for CSV
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
            let payload: any = {};
            try {
                payload = JSON.parse(r.payload_json ?? "{}");
            } catch {
                payload = {};
            }

            const membersArr = Array.isArray(payload.members) ? payload.members : [];
            const email = r.contact_email ?? payload?.contact?.email ?? "";
            const phone = r.contact_phone ?? "";

            for (const m of membersArr) {
                const memberId: string = m?.memberId ?? "";
                const name = memberMap.get(memberId)?.full_name ?? memberId;
                const attendCer = !!m?.attending?.ceremony;
                const attendRec = !!m?.attending?.reception;
                const dietary = m?.dietary ?? "";
                const mNotes = m?.notes ?? "";

                rows.push({
                    "Party Name": r.party_name,
                    "Member Name": name,
                    Phone: asExcelText(phone),
                    Email: email,
                    "Email Reminders": asYesNo(r.reminder_opt_in ?? payload?.reminderOptIn),
                    "Attending Ceremony": asYesNo(attendCer),
                    "Attending Reception": asYesNo(attendRec),
                    Dietary: dietary,
                    Notes: mNotes,
                });
            }

            // Edge case: if no members array, still emit one line for the party
            if (membersArr.length === 0) {
                rows.push({
                    "Party Name": r.party_name,
                    "Member Name": "",
                    Phone: asExcelText(phone),
                    Email: email,
                    "Email Reminders": asYesNo(r.reminder_opt_in ?? payload?.reminderOptIn),
                    "Attending Ceremony": "",
                    "Attending Reception": "",
                    Dietary: "",
                    Notes: String(payload.notes ?? ""),
                });
            }
        }

        // 5) Build Excel-friendly CSV
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
    } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
