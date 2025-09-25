import { Env, json } from "../_util";
import { ReminderSend } from "../reminders";

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
    const raw = (params as any).title ?? "";
    let current = String(raw);
    try {
        current = decodeURIComponent(current);
    } catch {}
    current = current.trim().normalize("NFC");

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
    const raw = (params as any).title ?? "";
    let title = String(raw);
    try {
        title = decodeURIComponent(title);
    } catch {}
    title = title.trim().normalize("NFC");

    if (!title) return json({ ok: false, error: "missing title" }, { status: 400 });

    const res = await env.DB.prepare(`DELETE FROM reminder_sends WHERE reminder_title=?`)
        .bind(title)
        .run();

    if (!res.meta || res.meta.changes === 0) {
        console.log("DELETE missed. Wanted:", JSON.stringify(title));
        return json({ ok: false, error: `no row with title '${title}'` }, { status: 404 });
    }

    return json({ ok: true, deleted: res.meta.changes });
};
