import { Env, json } from "../_utils";

export type ReminderSend = {
    reminder_title: string;
    send_date: string;
    days_out: string;
    html_content_index: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    const rows = await env.DB.prepare(
        `
SELECT reminder_title, send_date, days_out, html_content_index
FROM reminder_sends
ORDER BY (send_date IS NULL), send_date ASC, reminder_title ASC
`
    ).all<ReminderSend>();
    return new Response(JSON.stringify({ ok: true, items: rows.results || [] }), {
        headers: { "content-type": "application/json" },
    });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = (await request.json()) as ReminderSend;
        const title = String(body.reminder_title || "").trim();
        const send_date =
            body.send_date && String(body.send_date).trim() !== "" ? String(body.send_date) : null;
        const days_out =
            body.days_out === null || body.days_out === undefined || (body.days_out as any) === ""
                ? null
                : Number(body.days_out);
        const html_index = Number(body.html_content_index || 0);

        if (!title) return jsonBad(400, "reminder_title is required");
        const both = send_date && days_out !== null;
        const neither = !send_date && days_out === null;
        if (both || neither)
            return json({ error: "Provide exactly one of send_date or days_out" }, 400);

        await env.DB.prepare(
            `
INSERT INTO reminder_sends(reminder_title, send_date, days_out, html_content_index)
VALUES (?, ?, ?, ?)
ON CONFLICT(reminder_title) DO UPDATE SET
send_date=excluded.send_date,
days_out=excluded.days_out,
html_content_index=excluded.html_content_index
`
        )
            .bind(title, send_date, days_out, html_index)
            .run();

        return new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e: any) {
        return json({ error: "Failed to add/update reminder" }, 400);
    }
};

function jsonBad(status: number, message: string) {
    return new Response(JSON.stringify({ ok: false, error: message }), {
        status,
        headers: { "content-type": "application/json" },
    });
}
