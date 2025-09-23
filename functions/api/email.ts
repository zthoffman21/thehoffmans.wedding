import type { Env } from "./_utils";

function currentYM() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
async function getCount(env: Env): Promise<number> {
  const ym = currentYM();
  const row = await env.DB.prepare("SELECT count FROM email_usage WHERE ym=?")
    .bind(ym).first<{ count: number }>();
  return row?.count ?? 0;
}
async function setCount(env: Env, newCount: number) {
  const ym = currentYM();
  await env.DB.prepare(`
    INSERT INTO email_usage (ym, count) VALUES (?, ?)
    ON CONFLICT(ym) DO UPDATE SET count=excluded.count
  `).bind(ym, newCount).run();
}

/* ----- helpers ----- */
function toList(s: string | string[]) {
  return Array.isArray(s) ? s : s.split(",").map(x => x.trim()).filter(Boolean);
}

async function resendSend(env: Env, to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    const err: any = new Error(`Resend failed ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return true;
}

export async function sendEmail(
  env: Env,
  opts: { to: string | string[]; subject: string; html: string },
  config: { warnAt?: number } = { warnAt: 90 }
) {
  if (env.EMAIL_ENABLED === "false") {
    console.log("[email] disabled; would send:", { to: opts.to, subject: opts.subject });
    return { ok: true, disabled: true };
  }

  const warnAt = config.warnAt ?? 90;
  const adminList = env.EMAIL_ADMIN_TO ? toList(env.EMAIL_ADMIN_TO) : [];
  const to = toList(opts.to);

  try {
    await resendSend(env, to, opts.subject, opts.html);

    const current = await getCount(env);
    const next = current + 1;
    await setCount(env, next);

    if (next === warnAt && adminList.length) {
      try {
        await resendSend(
          env,
          adminList,
          "⚠️ Resend usage nearing your threshold",
          `<p>You have sent ${next} emails in ${currentYM()} (free cap is 100 on the free plan).</p>`
        );
      } catch (warnErr) {
        console.error("Warning email failed:", warnErr);
      }
    }

    return { ok: true, count: next };
  } catch (e: any) {
    const status = e?.status ?? 0;
    const body = e?.body ?? "";
    // 402 = Payment Required (likely quota exceeded on free plan)
    if (status === 402) {
      console.warn("[email] Resend quota or billing error (402).", { subject: opts.subject, body });
    } else if (status === 429) {
      console.warn("[email] Resend rate-limited (429). Consider retry/backoff.", { subject: opts.subject, body });
    } else {
      console.error("[email] Resend failed:", status, body);
    }
    return { ok: false, status, error: String(e?.message ?? e), body };
  }
}
