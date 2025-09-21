/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../../../_utils";
import { json } from "../../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id || "");
  if (!id) return json({ ok: false, message: "Missing id" }, { status: 400 });

  await env.DB.prepare(
    `UPDATE photos SET status='approved', is_public=1 WHERE id=?`
  ).bind(id).run();

  return json({ ok: true });
};
