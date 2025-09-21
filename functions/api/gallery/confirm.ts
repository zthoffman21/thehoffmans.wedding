/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";

type PhotoMeta = {
  imageId?: string;
  size?: number | null;
  caption?: string | null;
  display_name?: string | null;
  width?: number | null;
  height?: number | null;
};
type ConfirmBody =
  | { key?: string; size?: number }
  | { photos?: PhotoMeta[] };

const json = (d: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(d), {
    ...init,
    headers: { "content-type": "application/json; charset=UTF-8", ...(init.headers || {}) },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // ---- parse ----
    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return json({ ok: false, message: "Expected application/json" }, { status: 400 });
    }
    const body = (await request.json().catch(() => null)) as ConfirmBody | null;
    if (!body || typeof body !== "object") {
      return json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
    }

    let photos: PhotoMeta[] = Array.isArray((body as any).photos)
      ? (body as any).photos
      : (body as any).key
      ? [{ imageId: (body as any).key, size: (body as any).size ?? null }]
      : [];
    photos = photos
      .map(p => ({
        imageId: typeof p.imageId === "string" ? p.imageId : undefined,
        size: p.size == null ? null : Number(p.size),
        caption: p.caption ?? null,
        display_name: p.display_name ?? null,
        width: p.width == null ? null : Number(p.width),
        height: p.height == null ? null : Number(p.height),
      }))
      .filter(p => !!p.imageId);
    if (photos.length === 0) return json({ ok: false, message: "No photos to confirm" }, { status: 400 });

    // ---- (Removed Turnstile) ----

    // ---- R2 sanity (HEAD) ----
    for (const p of photos) {
      const head = await env.R2.head(p.imageId!);
      if (!head) return json({ ok: false, message: "Object not found in R2", key: p.imageId }, { status: 404 });
      if (Number.isFinite(p.size as number) && p.size != null && head.size !== Number(p.size)) {
        return json({ ok: false, message: "Size mismatch", key: p.imageId, expected: p.size, actual: head.size }, { status: 409 });
      }
    }

    // ---- moderation defaults from settings ----
    const row = await env.DB.prepare(
      `SELECT value FROM settings WHERE key='auto_publish_uploads' LIMIT 1`
    ).first<{ value?: string }>();
    const auto = row?.value === "1"; // '1' => auto publish  (else pending review)
    const initialStatus = auto ? "approved" : "pending";
    const initialPublic = auto ? 1 : 0; // hide until approved when pending  :contentReference[oaicite:10]{index=10}

    // ---- batch insert (id = imageId) ----
    const stmts = photos.map(p =>
      env.DB.prepare(
        `INSERT INTO photos
           (id, album_id, caption, display_name, width, height, taken_at, status, is_public, created_at)
         VALUES
           (?,  'album_default', ?,      ?,           ?,     ?,      NULL,     ?,      ?,         CURRENT_TIMESTAMP)`
      ).bind(
        p.imageId!,             // id = R2 key
        p.caption,
        p.display_name,
        p.width,
        p.height,
        initialStatus,
        initialPublic,
      )
    );
    await env.DB.batch(stmts);

    return json({ ok: true, inserted: photos.length, status: initialStatus });
  } catch (err: any) {
    console.error("confirm batch error:", err);
    return json({ ok: false, message: String(err?.message || err) }, { status: 500 });
  }
};
