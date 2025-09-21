/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../_utils";
import { json } from "../../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, params }) => {
  const raw = String(params.id ?? "");
  const id = decodeURIComponent(raw);

  if (!id) return json({ ok: false, message: "Missing id" }, { status: 400 });

  const res = await env.DB
    .prepare(`UPDATE photos SET status='rejected', is_public=0 WHERE id=?`)
    .bind(id)
    .run();

  const changed = (res as any)?.meta?.changes ?? 0;
  if (!changed) return json({ ok: false, message: "Photo not found" }, { status: 404 });

  return json({ ok: true, id, changed });
};
