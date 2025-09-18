/// <reference types="@cloudflare/workers-types" />

import { z } from "zod";

export type Env = {
  DB: D1Database;
  NOTIFY_EMAIL_TO?: string; // optional email ping on submit
  NOTIFY_FROM?: string;     // e.g. rsvp@yourdomain.com
  ADMIN_TOKEN?: string;     // if you add /api/admin/export later
};

export const RSVPSubmissionSchema = z.object({
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  members: z.array(z.object({
    memberId: z.string(),
    attending: z.object({
      ceremony: z.boolean().nullable(),
      reception: z.boolean().nullable(),
    }),
    dietary: z.string().max(500).optional(),
  })),
  notes: z.string().max(1000).optional(),
});

export function json(data: unknown, init?: number | ResponseInit) {
  const status = typeof init === "number" ? init : (init as ResponseInit | undefined)?.status ?? 200;
  const headers = new Headers(typeof init === "object" ? (init as ResponseInit).headers : undefined);
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...(typeof init === "object" ? init : {}), status, headers });
}

export function newId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function notifyEmail(env: Env, subject: string, text: string) {
  if (!env.NOTIFY_EMAIL_TO || !env.NOTIFY_FROM) return;
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: env.NOTIFY_EMAIL_TO }] }],
      from: { email: env.NOTIFY_FROM, name: "Wedding RSVP Bot" },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });
}
