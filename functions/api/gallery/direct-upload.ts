// /functions/api/gallery/direct-upload.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Env } from "../_utils";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
  const { files } = await request.json<{ files: number }>();

    const accountId = env.R2_ACCOUNT_ID;
    const bucket = env.R2_BUCKET;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing R2 env: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    }

    // 2) Create S3 client (OBJECT, not array)
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey }, // now definitely strings
      forcePathStyle: true, // required for R2
    });

    // 3) Generate N presigned PUT URLs
    const items: Array<{ key: string; uploadURL: string }> = [];
    for (let i = 0; i < files; i++) {
      const key = `uploads/${crypto.randomUUID()}`; // add file extension on client if you want
      const cmd = new PutObjectCommand({
        Bucket: bucket,         // <-- this fixes "No value for HTTP label: Bucket"
        Key: key,
        ContentType: "application/octet-stream",
      });
      const uploadURL = await getSignedUrl(s3, cmd, { expiresIn: 900 });
      items.push({ key, uploadURL });
    }

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, message: String(err?.message || err) }), { status: 500 });
  }
};