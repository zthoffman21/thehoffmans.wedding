/// <reference types="@cloudflare/workers-types" />
type Env = { DB: D1Database };

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  // Is the binding present?
  if (!env.DB) {
    return new Response(JSON.stringify({
      ok: false,
      where: "binding",
      message: "No D1 binding named 'DB' attached to this Pages environment."
    }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }

  try {
    const ping = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    const table = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('parties','party_fts')"
    ).first<{ name?: string }>();

    return new Response(JSON.stringify({
      ok: true,
      dbBound: true,
      dbQuery: ping?.ok === 1,
      hasCoreTable: !!table?.name,
      whichTableFound: table?.name ?? null
    }), { headers: { "content-type": "application/json; charset=utf-8" } });
  } catch (e) {
    // Try to surface common D1 error messages
    return new Response(JSON.stringify({
      ok: false,
      where: "query",
      message: (e as Error).message ?? String(e)
    }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }
};
