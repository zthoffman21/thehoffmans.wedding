/// <reference types="@cloudflare/workers-types" />
type Env = { DB: D1Database };

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    return new Response(JSON.stringify({ ok: true, db: row?.ok === 1 }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "DB unreachable" }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
};
