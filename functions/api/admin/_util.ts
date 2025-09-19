/// <reference types="@cloudflare/workers-types" />
export type Env = {
  DB: D1Database;
  ACCESS_AUD: string;
  ACCESS_ISSUER: string;
};

type Role = 'owner' | 'editor' | 'viewer';
const ORDER: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    ...init,
  });
}

export async function requireAdmin(request: Request, env: Env, minRole: Role) {
  const jwt = request.headers.get('CF-Access-Jwt-Assertion');
  if (!jwt) return new Response('Unauthorized', { status: 401 });
  // Rely on Access-gated routes; light claim check
  const claims = JSON.parse(atob(jwt.split('.')[1] || '')) as any;
  if (claims?.aud !== env.ACCESS_AUD || !claims?.email) {
    return new Response('Unauthorized', { status: 401 });
  }
  const email = String(claims.email).toLowerCase();
  const row = await env.DB
    .prepare(`SELECT role FROM admin_users WHERE email = ? LIMIT 1`)
    .bind(email)
    .first<{ role: Role }>();
  if (!row || ORDER[row.role] < ORDER[minRole]) return new Response('Forbidden', { status: 403 });
  return { email, role: row.role as Role };
}
