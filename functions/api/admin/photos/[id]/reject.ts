/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../_utils";
import { json } from "../../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, params }) => {
    const raw = String(params.id ?? "");
    const id = decodeURIComponent(raw); // key === photos.id

    if (!id) return json({ ok: false, message: "Missing id" }, { status: 400 });

    const res = await env.DB.prepare(`UPDATE photos SET status='rejected', is_public=0 WHERE id=?`)
        .bind(id)
        .run();

    const changed = (res as any)?.meta?.changes ?? 0;
    if (!changed) return json({ ok: false, message: "Photo not found" }, { status: 404 });

    const setting = await env.DB.prepare(
        `SELECT value FROM settings WHERE key='purge_rejected_uploads'`
    ).first<{ value?: string }>();
    const shouldPurge = setting?.value ? setting.value === "1" : true;

    let r2Deleted = false;
    if (shouldPurge) {
        try {
            await env.R2.delete(id);
            r2Deleted = true;
        } catch (e) {
            console.warn("R2 delete failed for", id, e);
        }
    }

    return json({ ok: true, id, r2Deleted, changed });
};
