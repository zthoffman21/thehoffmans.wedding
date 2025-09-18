/// <reference types="@cloudflare/workers-types" />
import { json, RSVPSubmissionSchema, newId, notifyEmail, type Env } from "../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
  const partyId = String(params.id);

  // Ensure party exists and is allowed to RSVP
  const party = await env.DB
    .prepare(`SELECT id, display_name, can_rsvp, rsvp_deadline FROM parties WHERE id = ?`)
    .bind(partyId)
    .first<{ id: string; display_name: string; can_rsvp: number; rsvp_deadline?: string | null }>();

  if (!party) return json({ error: "Not found" }, 404);
  if (party.can_rsvp === 0) return json({ error: "RSVP not enabled for this invitation" }, 403);
  if (party.rsvp_deadline) {
    const deadline = Date.parse(party.rsvp_deadline);
    if (!Number.isNaN(deadline) && Date.now() > deadline) {
      return json({ error: "RSVP deadline has passed" }, 403);
    }
  }

  // Parse JSON body
  const body = await request.json().catch(() => null);
  const parsed = RSVPSubmissionSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid payload", issues: parsed.error.format() }, 400);

  // Optional idempotency: if client sends a key, return existing submission
  const idemKey = request.headers.get("x-idempotency-key");
  if (idemKey) {
    const prior = await env.DB
      .prepare(`SELECT submission_id FROM idempotency WHERE key = ?`)
      .bind(idemKey)
      .first<{ submission_id?: string }>();
    if (prior?.submission_id) return json({ ok: true, submissionId: prior.submission_id });
  }

  const submissionId = newId("rsvp");
  const payloadJson = JSON.stringify(parsed.data);

  // Record immutable submission
  await env.DB.prepare(
    `INSERT INTO rsvp_submissions (id, party_id, contact_email, contact_phone, payload_json)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    submissionId,
    partyId,
    parsed.data.contact?.email ?? null,
    parsed.data.contact?.phone ?? null,
    payloadJson
  ).run();

  // Upsert current attendance for each member
  await env.DB.prepare("BEGIN").run();
  try {
    for (const m of parsed.data.members) {
      await env.DB.prepare(
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
      ).run();
    }
    // Save idempotency record if present
    if (idemKey) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO idempotency (key, submission_id) VALUES (?, ?)`
      ).bind(idemKey, submissionId).run();
    }
    await env.DB.prepare("COMMIT").run();
  } catch (e) {
    await env.DB.prepare("ROLLBACK").run();
    throw e;
  }

  // Optional email notification to you
  await notifyEmail(
    env,
    `New RSVP: ${party.display_name}`,
    `Party ${party.display_name} submitted an RSVP.\nSubmission ID: ${submissionId}\n`
  );

  return json({ ok: true, submissionId });
};
