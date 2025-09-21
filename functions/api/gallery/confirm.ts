/// <reference types="@cloudflare/workers-types" />
import { type Env } from "../_utils";

function json(data: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: { "content-type": "application/json; charset=UTF-8", ...(init.headers || {}) },
    });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    // Basic env sanity
    const hasR2 = !!(env as any).R2;
    const hasDB = !!(env as any).DB;
    const hasTurnstile = !!(env as any).TURNSTILE_SECRET;

    try {
        // Ensure JSON
        const ct = request.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
            return json(
                { ok: false, where: "confirm", message: "Expected application/json" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return json(
                { ok: false, where: "confirm", message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { key, size, checksum, token } = body as {
            key?: string;
            size?: number;
            checksum?: string;
            token?: string;
        };

        if (!key) return json({ ok: false, message: "Missing key" }, { status: 400 });

        if (!env.TURNSTILE_SECRET) {
            return json(
                { ok: false, where: "confirm", message: "TURNSTILE_SECRET missing" },
                { status: 500 }
            );
        }
        if (!token) {
            return json(
                { ok: false, where: "confirm", message: "Turnstile token missing" },
                { status: 400 }
            );
        }

        const form = new URLSearchParams();
        form.set("secret", env.TURNSTILE_SECRET);
        form.set("response", token);

        const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: form,
        });

        const verify = (await resp.json()) as { success: boolean; ["error-codes"]?: string[] };
        if (!verify.success) {
            return json(
                { ok: false, message: "Turnstile failed", errors: verify["error-codes"] || [] },
                { status: 403 }
            );
        }

        // Optional: write row to D1
        if (hasDB) {
            await env.DB.prepare(
                `INSERT INTO gallery_photos (id, r2_key, bytes, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
            )
                .bind(crypto.randomUUID(), key, size ?? null)
                .run();
        }

        return json({ ok: true, key });
    } catch (err) {
        // Log full details to CF logs; return safe message to client
        console.error("gallery/confirm error:", err, { hasR2, hasDB, hasTurnstile });
        return json(
            { ok: false, where: "confirm", message: "Internal error. Check logs." },
            { status: 500 }
        );
    }
};
