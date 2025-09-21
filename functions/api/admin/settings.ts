/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";
import { json } from "../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ ok: false, message: "Expected application/json" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({})) as Partial<{
    auto_publish_uploads: "0" | "1" | 0 | 1 | boolean;
    upload_rate_per_hour: number | string;
  }>;

  const entries: Array<[string, string]> = [];
  if (body.auto_publish_uploads !== undefined) {
    const v = (body.auto_publish_uploads === true || body.auto_publish_uploads === 1 || body.auto_publish_uploads === "1") ? "1" : "0";
    entries.push(["auto_publish_uploads", v]);
  }
  if (body.upload_rate_per_hour !== undefined) {
    const n = Math.max(1, Number(body.upload_rate_per_hour || 20));
    entries.push(["upload_rate_per_hour", String(n)]);
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
