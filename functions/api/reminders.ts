/// <reference types="@cloudflare/workers-types" />
import { Resend } from "resend";
import { Env } from "./_utils";
import { EMAIL_SUBJECTS, thankYouTemplate, defaultTemplate, photoUploadTemplate, finalLogisticsTemplate, rsvpDeadlineReminderTemplate } from "./reminder_html";

/* ----------------------------- Types ----------------------------- */
type EmailContact = {
    display_name: string;
    contact_email: string;
    rsvp_deadline: string | null;
};

type ReminderRow = {
    reminder_title: string;
    send_date: string | null;
    days_out: number | null;
    html_content_index: number;
};

/**
 * Convert a UTC ISO string to New York time zone
 * and return as MM/DD/YYYY.
 */
export function formatNYDateShort(utcIso: string): string {
  const d = new Date(utcIso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Convert a UTC ISO string to New York time zone
 * and return as "Month Day, YYYY at h:mm AM/PM".
 * Example: "September 24, 2025 at 6:30 PM"
 */
export function formatNYDateTimeLong(utcIso: string): string {
  const d = new Date(utcIso);
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${datePart} at ${timePart}`;
}


/* ---------------------- Ensure reminder_log ---------------------- */
async function ensureReminderLog(env: Env) {
    await env.DB.prepare(
        `
    CREATE TABLE IF NOT EXISTS reminder_log (
      id             TEXT PRIMARY KEY,
      reminder_title TEXT NOT NULL,
      email          TEXT NOT NULL,
      ymd            TEXT NOT NULL,   -- day bucket, e.g. '2025-09-24'
      kind           TEXT NOT NULL CHECK (kind IN ('ABSOLUTE','DAYS_OUT')),
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reminder_title, email, ymd)
    );
  `
    ).run();
    await env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_rlog_title_email ON reminder_log(reminder_title, email);`
    ).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_rlog_ymd ON reminder_log(ymd);`).run();
}

/* ------------------------ DB access helpers ---------------------- */
async function getEmailList(env: Env): Promise<EmailContact[]> {
    const stmt = await env.DB.prepare(`
    SELECT display_name, contact_email, rsvp_deadline
    FROM parties
    WHERE reminder_opt_in = 1
      AND contact_email IS NOT NULL
      AND contact_email != ''
  `);
    const res = await stmt.all<EmailContact>();
    return res.results || [];
}

async function getScheduledReminderList(env: Env): Promise<ReminderRow[]> {
    const stmt = await env.DB.prepare(`
    SELECT reminder_title, send_date, days_out, html_content_index
    FROM reminder_sends
    ORDER BY (send_date IS NULL), send_date ASC
  `);
    const res = await stmt.all<ReminderRow>();
    return res.results || [];
}

/* ---------------------------- Templating ------------------------- */
function renderHtml(index: number, ctx: { display_name: string, rsvp_deadline: string }): string {
    switch (index) {
        case 1:
			return rsvpDeadlineReminderTemplate(ctx.display_name, formatNYDateShort(ctx.rsvp_deadline), formatNYDateLong(ctx.rsvp_deadline));
		case 2:
			return finalLogisticsTemplate(ctx.display_name);
		case 3:
			return photoUploadTemplate(ctx.display_name);
		case 4:
			return thankYouTemplate(ctx.display_name);
		case 0:
        default:
			return defaultTemplate(ctx.display_name);
    }
}

/* -------------------------- Time helpers ------------------------- */
function toDate(d: string | null): Date | null {
    if (!d) return null;
    if (d.includes("T")) return new Date(d);
    return new Date(d.replace(" ", "T") + "Z");
}

function daysUntil(deadline: Date, now: Date): number {
    const d0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const d1 = Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate());
    return Math.round((d1 - d0) / 86400000);
}

function ymdNY(date: Date): string {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return fmt.format(date); // YYYY-MM-DD
}

/* ----------------------- Log + send (idempotent) ----------------- */
async function claimAndSendOne(
    resend: Resend,
    env: Env,
    kind: "ABSOLUTE" | "DAYS_OUT",
    reminderTitle: string,
    htmlIndex: number,
    subject: string,
    contact: EmailContact,
    ymd: string
): Promise<"sent" | "skipped-duplicate" | "failed"> {
    const myId = crypto.randomUUID();

    // 1) Try to claim (unique per reminder/email/day)
    await env.DB.prepare(
        `INSERT OR IGNORE INTO reminder_log (id, reminder_title, email, ymd, kind)
     VALUES (?, ?, ?, ?, ?)`
    )
        .bind(myId, reminderTitle, contact.contact_email.toLowerCase(), ymd, kind)
        .run();

    // 2) Check who owns the claim. If not us, skip.
    const row = await env.DB.prepare(
        `SELECT id FROM reminder_log WHERE reminder_title=? AND email=? AND ymd=? LIMIT 1`
    )
        .bind(reminderTitle, contact.contact_email.toLowerCase(), ymd)
        .first<{ id: string }>();

    if (!row) return "failed"; // unexpected
    if (row.id !== myId) return "skipped-duplicate";

    // 3) We own it — send the email
    try {
        const html = renderHtml(htmlIndex, { display_name: contact.display_name ?? "", rsvp_deadline: contact.rsvp_deadline ?? ""});
        await resend.emails.send({
            from: env.EMAIL_FROM,
            to: contact.contact_email,
            subject,
            html,
        });
        return "sent";
    } catch (e) {
        // Allow retry later by releasing our claim
        await env.DB.prepare(`DELETE FROM reminder_log WHERE id=?`).bind(myId).run();
        console.log("Email send failed:", contact.contact_email, e);
        return "failed";
    }
}

async function sendToAllWithLog(
    resend: Resend,
    env: Env,
    kind: "ABSOLUTE" | "DAYS_OUT",
    reminderTitle: string,
    htmlIndex: number,
    contacts: EmailContact[],
    subject: string,
    ymd: string
): Promise<{ successes: number; failures: number; skipped: number }> {
    let successes = 0,
        failures = 0,
        skipped = 0;

    for (const c of contacts) {
        const result = await claimAndSendOne(
            resend,
            env,
            kind,
            reminderTitle,
            htmlIndex,
            subject,
            c,
            ymd
        );
        if (result === "sent") successes++;
        else if (result === "failed") failures++;
        else skipped++;
    }

    return { successes, failures, skipped };
}

/* ---------------------------- Handler ---------------------------- */
export const onRequest: PagesFunction<Env> = async ({ env }) => {
    await ensureReminderLog(env);

    const now = new Date();
    const contacts = await getEmailList(env);
    const reminders = await getScheduledReminderList(env);

    const apiKey = (env as any).RESEND_API_KEY ?? (env as any).EMAIL_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY/EMAIL_API_KEY" }),
            { status: 500 }
        );
    }
    const resend = new Resend(apiKey);

    let processed = 0;

    for (const r of reminders) {
        const hasDaysOut = r.days_out !== null && r.days_out !== undefined;
        const hasSendDate = r.send_date !== null && r.send_date !== undefined;

        // Skip invalid rows: both null OR both non-null
        if ((hasDaysOut && hasSendDate) || (!hasDaysOut && !hasSendDate)) continue;

        // -------- Absolute (fixed date/time) --------
        if (hasSendDate) {
            const when = toDate(r.send_date);
            if (!when) continue;

            if (now >= when) {
                const subject = r.reminder_title;

                // IMPORTANT: use the intended send date as the log's day bucket
                // so it doesn't re-send on later days after success.
                const dayKey = ymdNY(when);

                await sendToAllWithLog(
                    resend,
                    env,
                    "ABSOLUTE",
                    r.reminder_title,
                    r.html_content_index,
                    contacts,
                    subject,
                    dayKey
                );

                processed++;
            }
            continue;
        }

        // -------- X days before each party's RSVP deadline --------
        if (hasDaysOut) {
            const dueToday: EmailContact[] = [];
            for (const c of contacts) {
                if (!c.rsvp_deadline) continue;
                const deadline = toDate(c.rsvp_deadline);
                if (!deadline) continue;
                const delta = daysUntil(deadline, now);
                if (r.days_out != null && delta <= r.days_out) dueToday.push(c);
            }

            if (dueToday.length) {
                const subject = r.reminder_title;
                const dayKey = ymdNY(now);

                await sendToAllWithLog(
                    resend,
                    env,
                    "DAYS_OUT",
                    r.reminder_title,
                    r.html_content_index,
                    dueToday,
                    subject,
                    dayKey
                );

                processed++;
            }
            continue;
        }
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
        headers: { "content-type": "application/json" },
    });
};
