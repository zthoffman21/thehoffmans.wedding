import { json, type Env } from "./_util";

type FlatRow = {
    // identity & ordering
    submission_id: string;
    submitted_at: string;

    // party / member display
    party_id: string;
    party_name: string | null;
    member_id?: string | null;
    member_name?: string | null;

    // CSV-like fields
    phone: string;
    email: string;
    email_reminders: boolean;
    attending_ceremony: boolean | "";
    attending_reception: boolean | "";
    dietary: string;
    notes: string;
};

type RawSubmissionRow = {
    id: string;
    party_id: string;
    party_name: string | null;
    payload_json: string | null;
    submitted_at: string;
    contact_email?: string | null;
    contact_phone?: string | null;
    reminder_opt_in?: number | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100);
    const cursor = url.searchParams.get("cursor"); // ISO (submitted_at) string

    const where = cursor ? `WHERE s.submitted_at < ?` : ``;

    // Pull a page of submissions with party info + contact fields
    const stmt = env.DB.prepare(
        `
    SELECT
      s.id,
      s.party_id,
      p.display_name AS party_name,
      s.payload_json,
      strftime('%Y-%m-%dT%H:%M:%SZ', submitted_at) AS submitted_at,
      s.contact_email,
      s.contact_phone,
      s.reminder_opt_in
    FROM rsvp_submissions s
    LEFT JOIN parties p ON p.id = s.party_id
    ${where}
    ORDER BY s.submitted_at DESC, s.id DESC
    LIMIT ?
    `
    );

    const res = cursor
        ? await stmt.bind(cursor, limit + 1).all<RawSubmissionRow>()
        : await stmt.bind(limit + 1).all<RawSubmissionRow>();

    const page = res.results ?? [];
    const hasMore = page.length > limit;
    const pageItems = hasMore ? page.slice(0, limit) : page;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]!.submitted_at : null;

    // Collect memberIds from this page to resolve names in one query
    const memberIds: string[] = [];
    for (const row of pageItems) {
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

    // Map member_id -> full_name
    const memberMap = new Map<string, { full_name: string }>();
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

    // Flatten each submission into CSV-like rows
    const flat: FlatRow[] = [];
    for (const r of pageItems) {
        let payload: any = {};
        try {
            payload = JSON.parse(r.payload_json ?? "{}");
        } catch {
            payload = {};
        }

        const membersArr = Array.isArray(payload.members) ? payload.members : [];
        const email = r.contact_email ?? payload?.contact?.email ?? "";
        const phone = r.contact_phone ?? "";
        const emailRem = Boolean(r.reminder_opt_in ?? payload?.reminderOptIn);

        if (membersArr.length === 0) {
            // still emit one party-only row
            flat.push({
                submission_id: r.id,
                submitted_at: r.submitted_at,
                party_id: r.party_id,
                party_name: r.party_name ?? null,
                member_id: null,
                member_name: null,
                phone: String(phone ?? ""),
                email,
                email_reminders: emailRem,
                attending_ceremony: "",
                attending_reception: "",
                dietary: "",
                notes: String(payload?.notes ?? ""),
            });
        } else {
            for (const m of membersArr) {
                const memberId: string | null = m?.memberId ?? null;
                const name = memberId ? memberMap.get(memberId)?.full_name ?? memberId : null;
                flat.push({
                    submission_id: r.id,
                    submitted_at: r.submitted_at,
                    party_id: r.party_id,
                    party_name: r.party_name ?? null,
                    member_id: memberId,
                    member_name: name,
                    phone: String(phone ?? ""),
                    email,
                    email_reminders: emailRem,
                    attending_ceremony: !!m?.attending?.ceremony,
                    attending_reception: !!m?.attending?.reception,
                    dietary: String(m?.dietary ?? ""),
                    notes: String(m?.notes ?? ""),
                });
            }
        }
    }

    return json({
        items: flat,
        nextCursor,
    });
};
