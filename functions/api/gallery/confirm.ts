/// <reference types="@cloudflare/workers-types" />
import { json } from "../_utils";

type Env = { DB: D1Database };

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const body = await request.json<{ photos: Array<{
      imageId: string; caption?: string; display_name?: string; width?: number; height?: number; taken_at?: string;
    }> }>();
    if (!body?.photos?.length) return json({ ok: false, message: "no photos" }, 400);

    const auto = await env.DB.prepare("SELECT value FROM settings WHERE key='auto_publish_uploads'")
      .first<{ value: string }>();
    const status = auto?.value === "1" ? "approved" : "pending";

    const stmt = env.DB.prepare(`
      INSERT INTO photos (id, album_id, caption, display_name, width, height, taken_at, status, is_public)
      VALUES (?, 'album_default', ?, ?, ?, ?, ?, ?, 1)
    `);

    const batch = body.photos.map((p) =>
      stmt.bind(
        p.imageId,
        p.caption ?? null,
        p.display_name ?? null,
        p.width ?? null,
        p.height ?? null,
        p.taken_at ?? null,
        status
      )
    );
    await env.DB.batch(batch);

    return json({ ok: true, status, count: body.photos.length });
  } catch (e) {
    return json({ ok: false, message: String(e) }, 500);
  }
};
