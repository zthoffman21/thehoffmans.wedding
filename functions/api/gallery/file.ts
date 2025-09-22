/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../_utils";

// Utility: build safe ASCII + RFC5987 UTF-8 filename pair
function buildNames(raw: string) {
  const dot = raw.lastIndexOf(".");
  const base = dot > 0 ? raw.slice(0, dot) : raw;
  const ext = dot > 0 ? raw.slice(dot) : ".jpg";
  const safeAscii =
    (base.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "photo") + ext;
  const utf8Star = "UTF-8''" + encodeURIComponent(base + ext).replace(/%20/g, "+");
  return { safeAscii, utf8Star, ext };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!key) return new Response("Missing key", { status: 400 });

  const disposition = (url.searchParams.get("disposition") || "inline").toLowerCase(); // "inline" | "attachment"
  const name = url.searchParams.get("name"); // optional friendly filename

  const obj = await env.R2.get(key);
  if (!obj || !obj.body) return new Response("Not found", { status: 404 });

  // Prefer the object’s content-type; fallback from filename
  const meta = obj.httpMetadata || {};
  let ct = meta.contentType;
  if (!ct) {
    if (/\.png$/i.test(key)) ct = "image/png";
    else if (/\.webp$/i.test(key)) ct = "image/webp";
    else if (/\.gif$/i.test(key)) ct = "image/gif";
    else ct = "image/jpeg";
  }

  const display = name || decodeURIComponent(key.split("/").pop() || "photo.jpg");
  const { safeAscii, utf8Star } = buildNames(display);

  const headers = new Headers();
  headers.set("Content-Type", ct);
  headers.set("Cache-Control", meta.cacheControl || "public, max-age=31536000, immutable");
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${safeAscii}"; filename*=${utf8Star}`
  );

  // Stream from R2 through our function with chosen headers
  return new Response(obj.body, { headers });
};
