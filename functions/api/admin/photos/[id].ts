/// <reference types="@cloudflare/workers-types" />
import { type Env, json } from "../../_utils";

function decodeKey(s: string) {
  try { return decodeURIComponent(s); } catch { return s; }
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "86400",
    },
  });

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  try {
    const rawId = String(ctx.params.id || "");
    if (!rawId) return json({ ok: false, message: "Missing id" }, 400);

    const id = decodeKey(rawId);

    const row = await ctx.env.DB.prepare(
      `SELECT id, status, is_public FROM photos WHERE id = ? LIMIT 1`
    ).bind(id).first<{ id: string; status: string; is_public: number }>();

    if (!row) return json({ ok: false, message: "Not found" }, 404);

    if (row.status !== "approved" || row.is_public !== 1) {
      return json({ ok: false, message: "Only posted images can be deleted" }, 400);
    }

    await ctx.env.DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(id).run();

    await ctx.env.R2.delete(id);

    return json({ ok: true }, 200);
  } catch (err: any) {
    return json(
      { ok: false, message: err?.message || "Delete failed" },
      500
    );
  }
};
