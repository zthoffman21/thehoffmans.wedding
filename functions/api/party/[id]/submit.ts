/// <reference types="@cloudflare/workers-types" />
import { json, RSVPSubmissionSchema, newId, type Env } from "../../_utils";
import { sendEmail } from "../../email";

type MemberRSVP = {
    memberId: string;
    attending: { ceremony: boolean | null; reception: boolean | null };
    dietary?: string | undefined;
    notes?: string | undefined;
};

type RSVPEmailPayload = {
    partyName: string;
    submissionId?: string;
    submittedAt?: string; // ISO or "YYYY-MM-DD HH:MM:SS"
    contactEmail?: string | null;
    contactPhone?: string | null;
    notes?: string | null; // party-level notes
    members: MemberRSVP[];
};

function escapeHtml(s: unknown): string {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function fmtNY(dt?: string) {
    if (!dt) return new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const d = new Date(dt.replace(" ", "T").replace(/Z?$/, "Z")); // tolerate DB timestamp
    return isNaN(+d)
        ? new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
        : d.toLocaleString("en-US", { timeZone: "America/New_York" });
}

function dotTag(text: string) {
    return `<span style="display:inline-block;background:#f0efe6;border:1px solid #e3e0d1;border-radius:999px;padding:2px 8px;font-size:12px;margin-right:6px;">${escapeHtml(
        text
    )}</span>`;
}

function attendanceChips(m: MemberRSVP) {
    const chips: string[] = [];
    const hasMulti =
        typeof m.attending.ceremony === "boolean" || typeof m.attending.reception === "boolean";
    if (hasMulti) {
        if (m.attending.ceremony === true) chips.push(dotTag("Ceremony ✓"));
        else if (m.attending.ceremony === false) chips.push(dotTag("Ceremony ✗"));
        if (m.attending.reception === true) chips.push(dotTag("Reception ✓"));
        else if (m.attending.reception === false) chips.push(dotTag("Reception ✗"));
    } else if (typeof m.attending === "boolean") {
        chips.push(dotTag(m.attending ? "Attending ✓" : "Not attending ✗"));
    }
}

function summarizeCounts(members: MemberRSVP[]) {
    const c = {
        total: members.length,
        ceremonyYes: members.filter((x) => x.attending.ceremony === true).length,
        receptionYes: members.filter((x) => x.attending.reception === true).length,
        dietary: members.filter((x) => (x.dietary ?? "").trim().length > 0).length,
        notes: members.filter((x) => (x.notes ?? "").trim().length > 0).length,
    };
    return c;
}

export function renderRSVPEmailHTML(payload: RSVPEmailPayload, adminUrl: string, csvUrl: string) {
    const { partyName, submissionId, submittedAt, contactEmail, contactPhone, notes, members } =
        payload;
    const counts = summarizeCounts(members);
    const headerSub = [
        submissionId ? `Submission ID: ${escapeHtml(submissionId)}` : null,
        `${fmtNY(submittedAt)} (ET)`,
    ]
        .filter(Boolean)
        .join(" • ");

    const summaryLine = (() => {
        const hasMulti = members.some(
            (m) =>
                typeof m.attending.ceremony === "boolean" ||
                typeof m.attending.reception === "boolean"
        );
        if (hasMulti) {
            return `<b>${counts.total}</b> member${counts.total === 1 ? "" : "s"} • Ceremony: <b>${
                counts.ceremonyYes
            }</b> ✓ • Reception: <b>${counts.receptionYes}</b> ✓`;
        }
        return `<b>${counts.total}</b> member${counts.total === 1 ? "" : "s"}`;
    })();

    const contactBits = [
        contactEmail ? `Email: ${escapeHtml(contactEmail)}` : null,
        contactPhone ? `Phone: ${escapeHtml(contactPhone)}` : null,
    ]
        .filter(Boolean)
        .join(" • ");

    const memberRows = members
        .map((m) => {
            const name = escapeHtml(m.memberId);
            const chips = attendanceChips(m);
            const dietary = (m.dietary ?? "").trim();
            const notes = (m.notes ?? "").trim();
            const extra = [
                dietary
                    ? `<div style="color:#5b5b5b;margin-top:3px;"><b>Dietary:</b> ${escapeHtml(
                          dietary
                      )}</div>`
                    : "",
                notes
                    ? `<div style="color:#5b5b5b;margin-top:3px;"><b>Notes:</b> ${escapeHtml(
                          notes
                      )}</div>`
                    : "",
            ].join("");
            return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-size:14px;line-height:1.35;">
            <div><b>${name}</b></div>
            ${extra}
          </div>
        </td>
      </tr>
    `;
        })
        .join("");

    return `
  <div style="background:#f6f5ef;padding:24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e7e4d8;">
            <tr>
              <td>
                <h2 style="margin:0 0 6px 0;font:600 20px ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;">New RSVP Received</h2>
                <div style="color:#666;font-size:12px;margin-bottom:16px;">${escapeHtml(
                    headerSub
                )}</div>

                <div style="font-size:16px;margin-bottom:6px;"><b>${escapeHtml(partyName)}</b></div>
                ${
                    contactBits
                        ? `<div style="color:#555;font-size:13px;margin-bottom:10px;">${contactBits}</div>`
                        : ""
                }

                <div style="font-size:14px;margin:10px 0 14px 0;">${summaryLine}
                  ${counts.dietary ? ` • Dietary entries: <b>${counts.dietary}</b>` : ""}
                  ${counts.notes ? ` • Member notes: <b>${counts.notes}</b>` : ""}
                </div>

                ${
                    notes
                        ? `
                  <div style="background:#faf7ec;border:1px solid #eee8d5;border-radius:10px;padding:10px 12px;font-size:14px;margin-bottom:12px;">
                    <b>Party Notes:</b> ${escapeHtml(notes)}
                  </div>`
                        : ""
                }

                <div style="height:1px;background:#eee;margin:14px 0;"></div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${memberRows}
                </table>

                <div style="height:1px;background:#eee;margin:18px 0;"></div>

                <!-- Buttons -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" style="margin:0 -6px;">
                  <tr>
                    <td style="padding:6px;">
                      <a href="${escapeHtml(adminUrl)}"
                        style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                               padding:12px 18px;border-radius:10px;font-weight:600;">
                        Review in Admin
                      </a>
                    </td>
                    <td style="padding:6px;">
                      <a href="${escapeHtml(csvUrl)}"
                        style="display:inline-block;background:#155e75;color:#fff;text-decoration:none;
                               padding:12px 18px;border-radius:10px;font-weight:600;">
                        Export to CSV
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="clear:both;"></div>

                <div style="color:#999;font-size:12px;margin-top:18px;">
                  This is an automated notification from thehoffmans.wedding
                </div>
              </td>
            </tr>
          </table>

          <div style="color:#999;font-size:11px;margin-top:10px;">Email ID: ${escapeHtml(
              (globalThis as any).crypto?.randomUUID?.() ?? ""
          )}</div>
        </td>
      </tr>
    </table>
  </div>`;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
    try {
        const rawId = String(params.id);

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
                `INSERT INTO rsvp_submissions (id, party_id, contact_email, contact_phone, reminder_opt_in, payload_json)
     VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(
                submissionId,
                party.id,
                parsed.data.contact?.email ?? null,
                parsed.data.contact?.phone ?? null,
                parsed.data.reminderOptIn ?? null,
                payloadJson
            )
        );

        // 2) per-member upserts
        for (const m of parsed.data.members) {
            stmts.push(
                env.DB.prepare(
                    `
  INSERT INTO member_attendance_current
    (member_id, attending_ceremony, attending_reception, dietary, notes)
  VALUES
    (?, ?, ?, ?, ?)
  ON CONFLICT(member_id) DO UPDATE SET
    attending_ceremony = excluded.attending_ceremony,
    attending_reception = excluded.attending_reception,
    dietary = excluded.dietary,
    notes = excluded.notes
         `
                ).bind(
                    m.memberId,
                    m.attending.ceremony === null ? null : m.attending.ceremony ? 1 : 0,
                    m.attending.reception === null ? null : m.attending.reception ? 1 : 0,
                    m.dietary ?? null,
                    m.notes ?? null
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

        const adminUrl = "https://thehoffmans.wedding/admin";
        const csvUrl = "https://thehoffmans.wedding/api/admin/export/latest-rsvps";

        const html = renderRSVPEmailHTML(
            {
                partyName: party.display_name,
                submissionId: submissionId,
                contactEmail: contactEmail,
                contactPhone: contactPhone,
                members: parsed.data.members,
            },
            adminUrl,
            csvUrl
        );

        await sendEmail(env, {
            to: env.EMAIL_ADMIN_TO,
            subject: `New RSVP: ${party.display_name}`,
            html,
        });

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
