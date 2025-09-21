/// <reference types="@cloudflare/workers-types" />
import { Env } from "./_utils";

/** Simple per-bucket moving-window rate limiter using D1 `rate_log`. */
export async function rateLimit(
  env: Env,
  request: Request,
  opts: { windowMins?: number; settingKey?: string } = {}
) {
  const windowMins = opts.windowMins ?? 60;

  // Derive a semi-sticky bucket: IP + UA + optional cookie
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  const ua = (request.headers.get("User-Agent") || "").slice(0, 64);
  const cookie = (request.headers.get("Cookie") || "").match(/rlid=([^;]+)/)?.[1] || "";
  const bucket = `ip:${ip}|ua:${ua}|c:${cookie.slice(0, 32)}`;

  // Read allowed tokens/hour from settings (falls back to 20)
  const row = await env.DB.prepare(
    `SELECT value FROM settings WHERE key='upload_rate_per_hour' LIMIT 1`
  ).first<{ value?: string }>();
  const limit = Math.max(1, Number(row?.value ?? 20)); // schema has default 20.  :contentReference[oaicite:6]{index=6}

  // Count within the last window
  const recent = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM rate_log WHERE bucket=? AND created_at >= DATETIME('now', ?)`,
  ).bind(bucket, `-${windowMins} minutes`).first<{ n: number }>();

  if ((recent?.n ?? 0) >= limit) {
    return { ok: false as const, status: 429 as const, remaining: 0, bucket };
  }

  // Spend a token
  await env.DB.prepare(
    `INSERT INTO rate_log(id, bucket, created_at) VALUES(?, ?, CURRENT_TIMESTAMP)`
  ).bind(crypto.randomUUID(), bucket).run();

  return { ok: true as const, status: 200 as const, remaining: Math.max(0, limit - 1 - (recent?.n ?? 0)), bucket };
}