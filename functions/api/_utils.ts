/// <reference types="@cloudflare/workers-types" />

import { string, z } from "zod";

export type Env = {
  DB: D1Database;
  NOTIFY_EMAIL_TO?: string; 
  NOTIFY_FROM?: string;
  ADMIN_TOKEN?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET?: string;
  TURNSTILE_SECRET?: string;
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
    notes: z.string().max(1000).optional(),
  })),
  reminderOptIn: z.boolean().optional(),
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

export async function sha256(
  input: string,
  encoding: "hex" | "base64url" = "hex"
): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return encoding === "hex" ? bufferToHex(buf) : bufferToBase64Url(buf);
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}