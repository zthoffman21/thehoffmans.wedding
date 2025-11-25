/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../_utils";

async function searchFTS(env: Env, q: string) {
  const stmt = env.DB.prepare(
    `SELECT f.party_id AS id, p.display_name AS label
     FROM party_fts f
     JOIN parties p ON p.id = f.party_id
     WHERE f MATCH ?
     LIMIT 10`
  ).bind(q.replace(/\s+/g, " "));
  const { results } = await stmt.all<{ id: string; label: string }>();
  return results ?? [];
}

async function searchLike(env: Env, q: string) {
  // Fallback if FTS is missing/broken
  const like = `%${q.replace(/\s+/g, "%")}%`;
  const { results } = await env.DB.prepare(
    `SELECT p.id AS id, p.display_name AS label
     FROM parties p
     LEFT JOIN members m ON m.party_id = p.id
     WHERE p.display_name LIKE ?
        OR m.full_name LIKE ?
     GROUP BY p.id
     ORDER BY p.display_name
     LIMIT 10`
  ).bind(like, like).all<{ id: string; label: string }>();
  return results ?? [];
}

async function handleGet(env: Env, request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return json({ results: [] });

  try {
    // Try FTS first
    const results = await searchFTS(env, q);
    return json({ results });
  } catch (e) {
    // Fallback to LIKE
    try {
      const results = await searchLike(env, q);
      return json({ results, fallback: "like" });
    } catch (e2) {
      return json({ error: "search failed", detail: String(e2) }, 500);
    }
  }
}

export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  // Be tolerant: treat POST the same as GET
  if (request.method === "GET" || request.method === "HEAD" || request.method === "POST") {
    return handleGet(env, request);
  }
  return json({ error: "Method not allowed" }, 405);
};
