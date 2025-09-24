/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";

type ReminderLogRow = {
    id: string;
    reminder_title: string;
    email: string;
    ymd: string;
    kind: "ABSOLUTE" | "DAYS_OUT";
    created_at: string;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const url = new URL(request.url);
        const reminder = url.searchParams.get("reminder");
        const ymd = url.searchParams.get("ymd");
        const email = url.searchParams.get("email");
        const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
        const cursor = url.searchParams.get("cursor"); // created_at|id

        const where: string[] = [];
        const binds: any[] = [];

        if (reminder) {
            where.push("reminder_title LIKE ?");
            binds.push(`%${reminder}%`);
        }
        if (ymd) {
            where.push("ymd = ?");
            binds.push(ymd);
        }
        if (email) {
            where.push("email LIKE ?");
            binds.push(`%${email}%`);
        }

        if (cursor) {
            const [cTime, cId] = cursor.split("|");
            where.push("(created_at < ? OR (created_at = ? AND id < ?))");
            binds.push(cTime, cTime, cId);
        }

        const sql = `SELECT id, reminder_title, email, ymd, kind, created_at
                 FROM reminder_log
                 ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
                 ORDER BY created_at DESC, id DESC
                 LIMIT ?`;
        binds.push(limit + 1);

        const rs = await env.DB.prepare(sql)
            .bind(...binds)
            .all<ReminderLogRow>();
        const rows = rs.results || [];

        let nextCursor: string | null = null;
        if (rows.length > limit) {
            const last = rows[limit - 1];
            nextCursor = `${last.created_at}|${last.id}`;
        }

        const items = rows.slice(0, limit);

        return new Response(JSON.stringify({ ok: true, items, nextCursor }), {
            headers: { "content-type": "application/json; charset=UTF-8" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
            status: 500,
            headers: { "content-type": "application/json; charset=UTF-8" },
        });
    }
};
