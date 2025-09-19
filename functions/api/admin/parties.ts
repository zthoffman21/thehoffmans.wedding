import { json, type Env } from "./_util";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  // If you have FTS5 party_fts(slug, display_name, etc.), prefer that; fallback to LIKE
  let sql = `SELECT p.id, p.slug, p.display_name,
                    (SELECT COUNT(*) FROM members m WHERE m.party_id = p.id) AS member_count
             FROM parties p`;
  let args: any[] = [];
  if (q) {
    sql += ` WHERE p.display_name LIKE ? OR p.slug LIKE ?`;
    args.push(`%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY p.display_name LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const res = await env.DB.prepare(sql).bind(...args).all();
  return json({ items: res.results ?? [], nextOffset: (res.results?.length ?? 0) === limit ? offset + limit : null });
};
