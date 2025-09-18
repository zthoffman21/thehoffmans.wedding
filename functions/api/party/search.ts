/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../_utils";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return json({ results: [] });

  // FTS5 search across display_name + concatenated member names (party_fts)
  const stmt = env.DB.prepare(
    `SELECT f.party_id AS id, p.display_name AS label
     FROM party_fts f
     JOIN parties p ON p.id = f.party_id
     WHERE f MATCH ?
     LIMIT 10`
  ).bind(q.replace(/\s+/g, " "));

  const { results } = await stmt.all<{ id: string; label: string }>();
  return json({ results: results ?? [] });
};
