/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";
import { json } from "../_utils";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending"; // "pending" | "approved"
    const album = url.searchParams.get("album") ?? "all"; // "all" | album_id
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);

    const albumFilter = album !== "all" && album !== "*" ? " AND album_id = ? " : "";

    const sql = `
    SELECT id, caption, display_name, width, height, created_at, album_id
    FROM photos
    WHERE status = ?
    ${albumFilter}
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `;

    const binds = albumFilter ? [status, album, limit] : [status, limit];
    const rows = await env.DB.prepare(sql)
        .bind(...binds)
        .all();

    return json({ ok: true, items: rows.results ?? [] });
};
