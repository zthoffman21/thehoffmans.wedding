import { Env, json } from "../_util";
import { ReminderSend } from "../reminders";

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
    const current = String((params as any).title || "");
    if (!current) return json(400);
    try {
        const body = (await request.json()) as ReminderSend;
        const nextTitle = String(body.reminder_title || current).trim();
        const send_date =
            body.send_date && String(body.send_date).trim() !== "" ? String(body.send_date) : null;
        const days_out =
            body.days_out === null || body.days_out === undefined || (body.days_out as any) === ""
                ? null
                : Number(body.days_out);
        const html_index = Number(body.html_content_index || 0);

        const both = send_date && days_out !== null;
        const neither = !send_date && days_out === null;
        if (both || neither) return json(400);

        // If renaming the PK, easiest path: delete then insert (wrapped in a transaction-like sequence)
        const tx1 = await env.DB.prepare(`DELETE FROM reminder_sends WHERE reminder_title=?`)
            .bind(current)
            .run();
        await env.DB.prepare(
            `INSERT INTO reminder_sends(reminder_title, send_date, days_out, html_content_index) VALUES (?, ?, ?, ?)`
        )
            .bind(nextTitle, send_date, days_out, html_index)
            .run();

        return new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e: any) {
        return json(500, e?.message || String(e));
    }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
    const title = String((params as any).title || "");
    if (!title) return json(400);
    await env.DB.prepare(`DELETE FROM reminder_sends WHERE reminder_title=?`).bind(title).run();
    return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
    });
};
