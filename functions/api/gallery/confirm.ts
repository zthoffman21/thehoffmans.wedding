/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";
import { sendEmail } from "../email";

type PhotoMeta = {
    imageId?: string;
    size?: number | null;
    caption?: string | null;
    display_name?: string | null;
    width?: number | null;
    height?: number | null;
    download_name?: string | null;
    album_id?: string | null;
};
type ConfirmBody = { key?: string; size?: number } | { photos?: PhotoMeta[] };

const json = (d: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(d), {
        ...init,
        headers: { "content-type": "application/json; charset=UTF-8", ...(init.headers || {}) },
    });

function escapeHtml(s: unknown): string {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function fmtBytes(n?: number | null) {
    if (!n || n <= 0) return "";
    const u = ["B", "KB", "MB", "GB", "TB"];
    let i = 0,
        v = n;
    while (v >= 1024 && i < u.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function basename(path: string) {
    try {
        return path.split("/").pop() || path;
    } catch {
        return path;
    }
}
function nowNY() {
    return new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour12: true });
}
function renderUploadEmailHTML(photos: PhotoMeta[], adminUrl?: string) {
    const count = photos.length;
    const maxList = 10;
    const more = Math.max(0, count - maxList);

    const byAlbum: Record<string, number> = {};
    for (const p of photos) {
        const a = p.album_id || "default";
        byAlbum[a] = (byAlbum[a] ?? 0) + 1;
    }
    const albumLines = Object.entries(byAlbum)
        .map(([a, c]) => `<li><b>${escapeHtml(a)}</b>: ${c}</li>`)
        .join("");

    const rows = photos
        .slice(0, maxList)
        .map((p) => {
            const name = escapeHtml(p.display_name || p.imageId);
            const cap = p.caption
                ? `&nbsp;—&nbsp;<span style="color:#666;">${escapeHtml(p.caption)}</span>`
                : "";
            const dims = p.width && p.height ? `${p.width}×${p.height}` : "";
            const size = fmtBytes(p.size);
            const meta = [dims, size].filter(Boolean).join(" • ");
            return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          <div style="font-size:14px;line-height:1.3;">
            <b>${name}</b>${cap}
            ${meta ? `<div style="color:#666;font-size:12px;margin-top:2px;">${meta}</div>` : ""}
            ${
                p.album_id
                    ? `<div style="color:#666;font-size:12px;margin-top:2px;">Album: ${escapeHtml(
                          p.album_id!
                      )}</div>`
                    : ""
            }
          </div>
        </td>
      </tr>
    `;
        })
        .join("");

    const moreLine = more
        ? `<tr><td style="padding:10px 0;color:#666;font-size:13px;">+${more} more …</td></tr>`
        : "";

    const button = adminUrl
        ? `
      <a href="${escapeHtml(adminUrl)}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                padding:12px 18px;border-radius:10px;font-weight:600;">
        Review in Admin
      </a>`
        : "";

    return `
  <div style="background:#f6f5ef;padding:24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e7e4d8;">
            <tr>
              <td>
                <h2 style="margin:0 0 8px 0;font:600 20px ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;">New Images Uploaded</h2>
                <div style="color:#666;font-size:12px;margin-bottom:16px;">${nowNY()} (ET)</div>

                <div style="font-size:16px;margin-bottom:12px;">
                  <b>${count}</b> photo${count === 1 ? "" : "s"} uploaded.
                </div>

                <div style="margin:12px 0 8px 0;">
                  <div style="font-size:14px;font-weight:600;margin-bottom:6px;">By album</div>
                  <ul style="margin:0;padding-left:18px;color:#333;font-size:14px;line-height:1.4;">
                    ${albumLines || "<li>Uncategorized</li>"}
                  </ul>
                </div>

                <div style="height:1px;background:#eee;margin:16px 0;"></div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${rows}
                  ${moreLine}
                </table>

                ${button ? `<div style="margin-top:20px;">${button}</div>` : ""}

                <div style="color:#999;font-size:12px;margin-top:18px;">
                  This is an automated notification from thehoffmans.wedding
                </div>
              </td>
            </tr>
          </table>

          <div style="color:#999;font-size:11px;margin-top:10px;">Email ID: ${escapeHtml(
              crypto.randomUUID?.() ?? ""
          )}</div>
        </td>
      </tr>
    </table>
  </div>`;
}

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
                album_id: (p as any).album_id ?? "album_general",
            }))
            .filter((p) => !!p.imageId);
        if (photos.length === 0)
            return json({ ok: false, message: "No photos to confirm" }, { status: 400 });

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

            // Rewrite headers if needed (contentType/cacheControl)
            const rawBase =
                p.download_name || decodeURIComponent(key.split("/").pop() || "photo.jpg");
            const dot = rawBase.lastIndexOf(".");
            const ext = dot > 0 ? rawBase.slice(dot) : ".jpg";
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
                    console.warn("R2.put rewrite failed for", key, e); // non-fatal
                }
            }
        }

        // ---- fetch moderation & email settings (ONE query) ----
        const keys = ["auto_publish_uploads", "email_admin_on_uploads"] as const;
        const rows = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN (?, ?)`)
            .bind(...keys)
            .all<{ key: string; value: string }>();
        const map = Object.fromEntries((rows.results ?? []).map((r) => [r.key, r.value]));
        const auto = (map["auto_publish_uploads"] ?? "0") === "1";
        const notify = (map["email_admin_on_uploads"] ?? "0") === "1";

        function basenameFromKey(k: string) {
            const s = k.split("/");
            return s[s.length - 1] || "photo.jpg";
        }

        // ---- batch insert (id = imageId) ----
        if (auto) {
            // Auto-publish: move tmp -> gallery/<album> and insert as approved/public
            for (const p of photos) {
                const tmpKey = p.imageId!;
                const albumId = (p.album_id || "album_general").trim();
                const finalKey = `gallery/${albumId}/${basenameFromKey(tmpKey)}`;

                const head = await env.R2.head(tmpKey);
                const obj = await env.R2.get(tmpKey);
                if (!obj || !obj.body) {
                    return json(
                        { ok: false, message: "Failed to read R2 object", key: tmpKey },
                        { status: 500 }
                    );
                }

                await env.R2.put(finalKey, obj.body, {
                    httpMetadata: {
                        contentType:
                            head?.httpMetadata?.contentType ||
                            (/\.(png)$/i.test(finalKey)
                                ? "image/png"
                                : /\.(webp)$/i.test(finalKey)
                                ? "image/webp"
                                : /\.(gif)$/i.test(finalKey)
                                ? "image/gif"
                                : "image/jpeg"),
                        cacheControl:
                            head?.httpMetadata?.cacheControl ||
                            "public, max-age=31536000, immutable",
                    },
                    customMetadata: head?.customMetadata,
                });
                await env.R2.delete(tmpKey);

                await env.DB.prepare(
                    `INSERT INTO photos
           (id, album_id, caption, display_name, width, height, taken_at, status, is_public, created_at)
           VALUES
           (?, ?, ?, ?, ?, ?, NULL, 'approved', 1, CURRENT_TIMESTAMP)`
                )
                    .bind(finalKey, albumId, p.caption, p.display_name, p.width, p.height)
                    .run();
            }

            // send email only if setting is enabled and a recipient is configured
            if (notify && env.EMAIL_ADMIN_TO) {
                const adminUrl = "https://thehoffmans.wedding/admin";
                const result = await sendEmail(env, {
                    to: env.EMAIL_ADMIN_TO,
                    subject: `New Images Uploaded: ${photos.length} photo(s)`,
                    html: renderUploadEmailHTML(photos, adminUrl),
                });
                if (!result.ok && result.status === 402) {
                    console.log("Email not sent: free-tier quota likely exceeded.");
                }
            }

            return json({ ok: true, inserted: photos.length, status: "approved" });
        } else {
            // Pending: keep in tmp, insert with pending/is_public=0
            const stmts = photos.map((p) =>
                env.DB.prepare(
                    `INSERT INTO photos
           (id, album_id, caption, display_name, width, height, taken_at, status, is_public, created_at)
           VALUES
           (?, ?, ?, ?, ?, ?, NULL, 'pending', 0, CURRENT_TIMESTAMP)`
                ).bind(
                    p.imageId!,
                    (p.album_id || "album_general").trim(),
                    p.caption,
                    p.display_name,
                    p.width,
                    p.height
                )
            );
            await env.DB.batch(stmts);

            if (notify && env.EMAIL_ADMIN_TO) {
                const adminUrl = "https://thehoffmans.wedding/admin";
                const result = await sendEmail(env, {
                    to: env.EMAIL_ADMIN_TO,
                    subject: `New Images Waiting For Approval: ${photos.length} photo(s)`,
                    html: renderUploadEmailHTML(photos, adminUrl),
                });
                if (!result.ok && result.status === 402) {
                    console.log("Email not sent: free-tier quota likely exceeded.");
                }
            }

            return json({ ok: true, inserted: photos.length, status: "pending" });
        }
    } catch (err: any) {
        console.error("confirm batch error:", err);
        return json({ ok: false, message: String(err?.message || err) }, { status: 500 });
    }
};
