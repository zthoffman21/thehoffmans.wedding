/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";

type PhotoMeta = {
    imageId?: string;
    size?: number | null;
    caption?: string | null;
    display_name?: string | null;
    width?: number | null;
    height?: number | null;
    download_name?: string | null;
};
type ConfirmBody = { key?: string; size?: number } | { photos?: PhotoMeta[] };

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
            .map((p) => ({
                imageId: typeof p.imageId === "string" ? p.imageId : undefined,
                size: p.size == null ? null : Number(p.size),
                caption: p.caption ?? null,
                display_name: p.display_name ?? null,
                width: p.width == null ? null : Number(p.width),
                height: p.height == null ? null : Number(p.height),
                download_name: p.download_name ?? null,
            }))
            .filter((p) => !!p.imageId);
        if (photos.length === 0)
            return json({ ok: false, message: "No photos to confirm" }, { status: 400 });

        // ---- R2 sanity (HEAD) ----
        // ---- R2 sanity (HEAD) + metadata finalize ----
        for (const p of photos) {
            const key = p.imageId!;
            const head = await env.R2.head(key);
            if (!head) {
                return json({ ok: false, message: "Object not found in R2", key }, { status: 404 });
            }
            if (
                Number.isFinite(p.size as number) &&
                p.size != null &&
                head.size !== Number(p.size)
            ) {
                return json(
                    {
                        ok: false,
                        message: "Size mismatch",
                        key,
                        expected: p.size,
                        actual: head.size,
                    },
                    { status: 409 }
                );
            }

            // --- build friendly filename (ASCII + RFC5987 UTF-8) ---
            const rawBase =
                p.download_name || decodeURIComponent(key.split("/").pop() || "photo.jpg");
            const dot = rawBase.lastIndexOf(".");
            const base = dot > 0 ? rawBase.slice(0, dot) : rawBase;
            const ext = dot > 0 ? rawBase.slice(dot) : ".jpg";

            // Choose a proper image Content-Type
            const desiredContentType =
                head.httpMetadata?.contentType ||
                (/\.(png)$/i.test(ext)
                    ? "image/png"
                    : /\.(webp)$/i.test(ext)
                    ? "image/webp"
                    : /\.(gif)$/i.test(ext)
                    ? "image/gif"
                    : "image/jpeg");

            const desired = {
                contentType: desiredContentType,
                cacheControl:
                    head.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
            };

            const current = {
                contentType: head.httpMetadata?.contentType,
                contentDisposition: head.httpMetadata?.contentDisposition,
                cacheControl: head.httpMetadata?.cacheControl,
            };

            const needsRewrite =
                current.contentType !== desired.contentType ||
                current.cacheControl !== desired.cacheControl;

            if (needsRewrite) {
                const obj = await env.R2.get(key);
                if (!obj || !obj.body) {
                    return json(
                        { ok: false, message: "Failed to read object body", key },
                        { status: 500 }
                    );
                }
                try {
                    await env.R2.put(key, obj.body, {
                        httpMetadata: desired,
                        customMetadata: head.customMetadata,
                    });
                } catch (e) {
                    console.warn("R2.put rewrite failed for", key, e);
                    // non-fatal
                }
            }
        }

        // ---- moderation defaults from settings ----
        const row = await env.DB.prepare(
            `SELECT value FROM settings WHERE key='auto_publish_uploads' LIMIT 1`
        ).first<{ value?: string }>();
        const auto = row?.value === "1";
        const initialStatus = auto ? "approved" : "pending";
        const initialPublic = auto ? 1 : 0; // hide until approved when pending

        // ---- batch insert (id = imageId) ----
        const stmts = photos.map((p) =>
            env.DB.prepare(
                `INSERT INTO photos
      (id, album_id, caption, display_name, width, height, taken_at, status, is_public, created_at)
     VALUES
      (?, 'album_default', ?, ?, ?, ?, NULL, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
                p.imageId!,
                p.caption,
                p.display_name,
                p.width,
                p.height,
                initialStatus,
                initialPublic
            )
        );
        await env.DB.batch(stmts);

        return json({ ok: true, inserted: photos.length, status: initialStatus });
    } catch (err: any) {
        console.error("confirm batch error:", err);
        return json({ ok: false, message: String(err?.message || err) }, { status: 500 });
    }
};
