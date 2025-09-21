/// <reference types="@cloudflare/workers-types" />
import { json, newId, type Env } from "../../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const b = await request.json<any>();
  if (!b?.party_id || !b?.full_name) return json({ error: "party_id and full_name required" }, 400);

  const id = newId?.() ?? crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO members (id, party_id, full_name, is_plus_one, plus_one_for, sort_order, invite_ceremony, invite_reception)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    b.party_id,
    b.full_name,
    Number(!!b.is_plus_one),
    b.plus_one_for ?? null,
    Number(b.sort_order ?? 0),
    Number(b.invite_ceremony ?? 1),
    Number(b.invite_reception ?? 1)
  ).run();

  return json({ ok: true, id });
};

export const onRequest = onRequestPost; // treat default as POST helper
