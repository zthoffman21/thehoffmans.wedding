/// <reference types="@cloudflare/workers-types" />
import { json, newId, type Env } from "../../_utils";

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.json<any>();
  const displayName = String(body?.display_name ?? "").trim();
  const slug = normalizeSlug(String(body?.slug ?? ""));

  if (!displayName) return json({ error: "display_name is required" }, 400);
  if (!slug) return json({ error: "slug is required" }, 400);

  const id = newId("party");
  try {
    await env.DB.prepare(
      `INSERT INTO parties (
         id, slug, display_name, contact_email, contact_phone, reminder_opt_in, can_rsvp, rsvp_deadline
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      slug,
      displayName,
      body?.contact_email ?? null,
      body?.contact_phone ?? null,
      Number(!!body?.reminder_opt_in),
      body?.can_rsvp === undefined ? 1 : Number(!!body.can_rsvp),
      body?.rsvp_deadline ?? null
    ).run();
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");
    if (msg.includes("UNIQUE constraint failed: parties.slug")) {
      return json({ error: "slug already exists" }, 409);
    }
    return json({ error: "failed to create party" }, 500);
  }

  return json({ ok: true, id, slug });
};

export const onRequest = onRequestPost;
