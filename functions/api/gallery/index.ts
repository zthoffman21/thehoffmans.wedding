/// <reference types="@cloudflare/workers-types" />
type Env = { DB: D1Database };
import { json } from "../_utils";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "40", 10), 80);
  const cursor = url.searchParams.get("cursor"); // "YYYY-mm-dd HH:MM:SS|id"

  const baseSql = `
    SELECT id, caption, display_name, width, height, created_at
    FROM photos
    WHERE status='approved' AND is_public=1
  `;
  let rows;
  if (cursor) {
    const [cTime, cId] = cursor.split("|");
    rows = await env.DB.prepare(
      `${baseSql}
       AND (created_at < ? OR (created_at = ? AND id < ?))
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    ).bind(cTime, cTime, cId, limit).all();
  } else {
    rows = await env.DB.prepare(
      `${baseSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    ).bind(limit).all();
  }

  const items = rows.results ?? [];
  const last = items[items.length - 1];
  const nextCursor = last ? `${last.created_at}|${last.id}` : null;

  return new Response(JSON.stringify({ items, nextCursor }), {
    headers: {
      "content-type": "application/json",
      "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
    },
  });
};
