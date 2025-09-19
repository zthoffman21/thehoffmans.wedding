/// <reference types="@cloudflare/workers-types" />
import { json, RSVPSubmissionSchema, newId, notifyEmail, type Env } from "../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
    // Wrap everything so we never return a bare 500
    try {
        const rawId = String(params.id); // could be "3" or "p_avery"

        // Resolve party by id OR slug, return canonical numeric/text id
        const party = await env.DB.prepare(
            `
        SELECT id, display_name, can_rsvp, rsvp_deadline
        FROM parties
        WHERE id = ? OR slug = ?
        LIMIT 1
      `
        )
            .bind(rawId, rawId)
            .first<{
                id: string;
                display_name: string;
                can_rsvp: number;
                rsvp_deadline?: string | null;
            }>();

        if (!party) return json({ error: "Not found" }, 404);
        if (party.can_rsvp === 0)
            return json({ error: "RSVP not enabled for this invitation" }, 403);
        if (party.rsvp_deadline) {
            const deadline = Date.parse(party.rsvp_deadline);
            if (!Number.isNaN(deadline) && Date.now() > deadline) {
                return json({ error: "RSVP deadline has passed" }, 403);
            }
        }

        // Parse + validate
        const body = await request.json().catch(() => null);
        const parsed = RSVPSubmissionSchema.safeParse(body);
        if (!parsed.success)
            return json({ error: "Invalid payload", issues: parsed.error.format() }, 400);

        // Idempotency check
        const idemKey = request.headers.get("x-idempotency-key");
        if (idemKey) {
            const prior = await env.DB.prepare(
                `SELECT submission_id FROM idempotency WHERE key = ?`
            )
                .bind(idemKey)
                .first<{ submission_id?: string }>();
            if (prior?.submission_id) return json({ ok: true, submissionId: prior.submission_id });
        }

        // Validate members belong to this party (prevents FK/500s)
        const memberIds = parsed.data.members.map((m) => m.memberId);
        if (memberIds.length === 0) return json({ error: "members[] required" }, 400);

        const placeholders = memberIds.map(() => "?").join(",");
        const belonging = await env.DB.prepare(
            `SELECT id FROM members WHERE party_id = ? AND id IN (${placeholders})`
        )
            .bind(party.id, ...memberIds)
            .all<{ id: number }>();

        const found = new Set((belonging?.results ?? []).map((r) => r.id));
        const missing = memberIds.filter((id) => !found.has(id as any));
        if (missing.length) {
            return json(
                { error: "Member(s) not in party", details: { partyId: party.id, missing } },
                400
            );
        }

        const submissionId = newId("rsvp");
        const payloadJson = JSON.stringify(parsed.data);

        const stmts: D1PreparedStatement[] = [];

        const contactEmail = parsed.data.contact?.email?.trim() || null;
        const contactPhone = parsed.data.contact?.phone?.trim() || null;

        const reminderOptIn =
            typeof parsed.data.reminderOptIn === "boolean"
                ? parsed.data.reminderOptIn
                    ? 1
                    : 0
                : null;

        // 1) submission row
        stmts.push(
            env.DB.prepare(
                `INSERT INTO rsvp_submissions (id, party_id, contact_email, contact_phone, payload_json)
     VALUES (?, ?, ?, ?, ?)`
            ).bind(
                submissionId,
                party.id,
                parsed.data.contact?.email ?? null,
                parsed.data.contact?.phone ?? null,
                payloadJson
            )
        );

        // 2) per-member upserts
        for (const m of parsed.data.members) {
            stmts.push(
                env.DB.prepare(
                    `INSERT INTO member_attendance_current (member_id, attending_ceremony, attending_reception, dietary)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         attending_ceremony = excluded.attending_ceremony,
         attending_reception = excluded.attending_reception,
         dietary = excluded.dietary`
                ).bind(
                    m.memberId,
                    m.attending.ceremony === null ? null : m.attending.ceremony ? 1 : 0,
                    m.attending.reception === null ? null : m.attending.reception ? 1 : 0,
                    m.dietary ?? null
                )
            );
        }

        // 3) idempotency (only if header provided)
        if (idemKey) {
            stmts.push(
                env.DB.prepare(
                    `INSERT OR IGNORE INTO idempotency (key, submission_id) VALUES (?, ?)`
                ).bind(idemKey, submissionId)
            );
        }

        stmts.push(
            env.DB.prepare(
                `UPDATE parties
       SET
         contact_email = COALESCE(?, contact_email),
         contact_phone = COALESCE(?, contact_phone),
         reminder_opt_in = COALESCE(?, reminder_opt_in)
     WHERE id = ?`
            ).bind(contactEmail, contactPhone, reminderOptIn, party.id)
        );

        // Execute atomically (works local + remote)
        await env.DB.batch(stmts);

        // Notify (outside of DB txn)
        await notifyEmail(
            env,
            `New RSVP: ${party.display_name}`,
            `Party ${party.display_name} submitted an RSVP.\nSubmission ID: ${submissionId}\n`
        );

        return json({ ok: true, submissionId });
    } catch (err: any) {
        // Log to CF tail and surface a helpful message
        console.error("RSVP submit error:", err?.message, err?.stack);
        return json(
            { ok: false, error: "Server error", message: err?.message ?? "Unknown error" },
            500
        );
    }
};
