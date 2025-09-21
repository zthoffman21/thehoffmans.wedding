import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Env } from "../_utils";

type UploadReq = { files?: number };

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    // Safely parse and narrow
    const payload = (await request.json().catch(() => ({}))) as UploadReq;
    const files = Math.max(1, Math.min(10, Number(payload.files ?? 1)));

    const accountId = env.R2_ACCOUNT_ID;
    const bucket = env.R2_BUCKET;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing env: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const items: Array<{ key: string; uploadURL: string }> = [];
    for (let i = 0; i < files; i++) {
      const key = `uploads/${crypto.randomUUID()}`;
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: "application/octet-stream" });
      const uploadURL = await getSignedUrl(s3, cmd, { expiresIn: 900 });
      items.push({ key, uploadURL });
    }

    return new Response(JSON.stringify({ ok: true, items }), { headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, message: String(err?.message || err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
