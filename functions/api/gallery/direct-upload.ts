import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../_utils";
import { rateLimit } from "../_rate";

/* ----------------------------- Types ----------------------------- */
type UploadItemReq = {
  filename?: string | null;
  contentType?: string | null;
  size?: number | null;
};
type UploadReq = { files?: number } | { items?: UploadItemReq[] };

type UploadItemResp = { key: string; uploadURL: string; contentType: string };

/* --------------------------- JSON helper ------------------------- */
function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...(init.headers || {}),
    },
  });
}

/* ------------------------- Small utilities ----------------------- */
const MAX_FILES = 10;
const DEFAULT_CT = "application/octet-stream";
function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
function coerceContentType(ct?: string | null) {
  const v = (ct || "").trim().toLowerCase();
  if (v.startsWith("image/")) return v;
  if (v === "") return DEFAULT_CT;
  return v;
}

/* --------------------------- Handler ----------------------------- */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    // Require JSON
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ ok: false, message: "Expected application/json" }, { status: 400 });
    }

    const rl = await rateLimit(env, request, { windowMins: 60 });
    if (!rl.ok) {
      return json({ ok: false, message: "Rate limit exceeded. Please try again later." }, { status: rl.status });
    }

    const body = (await request.json().catch(() => null)) as UploadReq | null;
    if (!body || typeof body !== "object") {
      return json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
    }

    /* ----------------------- Env / client set up ---------------------- */
    const accountId = env.R2_ACCOUNT_ID;
    const bucket = env.R2_BUCKET;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      return json(
        { ok: false, message: "Missing env: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY" },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    /* ------------------ Determine how many items ---------------------- */
    let requestedItems: UploadItemReq[] | null = null;
    if (Array.isArray((body as any).items) && (body as any).items.length > 0) {
      requestedItems = (body as any).items.slice(0, MAX_FILES);
    } else {
      const files = Math.max(1, Math.min(MAX_FILES, Number((body as any).files ?? 1)));
      requestedItems = Array.from({ length: files }, () => ({}));
    }

    /* ------------------ Create presigned URLs (short) ----------------- */
    const EXPIRES_SECONDS = 120; // keep short so unused URLs die quickly
    const items: UploadItemResp[] = [];

    for (const it of requestedItems) {
      const rawName = it.filename ? sanitizeName(it.filename) : "upload";
      const key = `gallery/tmp/${crypto.randomUUID()}-${rawName}`;
      const contentType = coerceContentType(it.contentType);

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadURL = await getSignedUrl(s3, cmd, { expiresIn: EXPIRES_SECONDS });
      items.push({ key, uploadURL, contentType });
    }

    return json({ ok: true, items });
  } catch (err: any) {
    console.error("direct-upload error", err);
    return json({ ok: false, message: String(err?.message || err) }, { status: 500 });
  }
};
