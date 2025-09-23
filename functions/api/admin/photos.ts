/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";
import { json } from "../_utils";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 200);

  const rows = await env.DB.prepare(
    `SELECT id, caption, display_name, width, height, created_at, album_id
     FROM photos WHERE status=? ORDER BY created_at DESC LIMIT ?`
  ).bind(status, limit).all();

  return json({ ok: true, items: rows.results || [] });
};
