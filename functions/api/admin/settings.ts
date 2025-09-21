/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";
import { json } from "../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
    if (!(request.headers.get("content-type") || "").includes("application/json")) {
        return json({ ok: false, message: "Expected application/json" }, { status: 400 });
    }
    const body = (await request.json().catch(() => ({}))) as Partial<{
        auto_publish_uploads: "0" | "1" | 0 | 1 | boolean;
        upload_rate_per_hour: number | string;
        purge_rejected_uploads: "0" | "1" | 0 | 1 | boolean;
    }>;

    const entries: Array<[string, string]> = [];
    if (body.auto_publish_uploads !== undefined) {
        const v =
            body.auto_publish_uploads === true ||
            body.auto_publish_uploads === 1 ||
            body.auto_publish_uploads === "1"
                ? "1"
                : "0";
        entries.push(["auto_publish_uploads", v]);
    }
    if (body.upload_rate_per_hour !== undefined) {
        const n = Math.max(1, Number(body.upload_rate_per_hour || 20));
        entries.push(["upload_rate_per_hour", String(n)]);
    }
    if (body.purge_rejected_uploads !== undefined) {
        const v =
            body.purge_rejected_uploads === true ||
            body.purge_rejected_uploads === 1 ||
            body.purge_rejected_uploads === "1"
                ? "1"
                : "0";
        entries.push(["purge_rejected_uploads", v]);
    }
    if (entries.length === 0) return json({ ok: false, message: "No changes" }, { status: 400 });

    const stmts = entries.map(([k, v]) =>
        env.DB.prepare(
            `INSERT INTO settings(key, value) VALUES(?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
        ).bind(k, v)
    );
    await env.DB.batch(stmts);

    return json({ ok: true, updated: Object.fromEntries(entries) });
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const KEYS = ["auto_publish_uploads", "upload_rate_per_hour", "purge_rejected_uploads"] as const;

  const placeholders = KEYS.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`
  ).bind(...KEYS).all<{ key: string; value: string }>();

  const map = Object.fromEntries((rows.results ?? []).map(r => [r.key, r.value]));

  const settings = {
    auto_publish_uploads: (map["auto_publish_uploads"] ?? "0") === "1",
    upload_rate_per_hour: Number(map["upload_rate_per_hour"] ?? 20),
    purge_rejected_uploads: (map["purge_rejected_uploads"] ?? "1") === "1",
  };

  return json({ ok: true, settings });
};