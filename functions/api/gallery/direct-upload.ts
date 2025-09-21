/// <reference types="@cloudflare/workers-types" />
import { json, newId } from "../_utils";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type Env = {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET: string;
  R2_ACCOUNT_ID: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const { files } = await request.json<{ files: number }>();
  if (!files || files < 1) return json({ ok: false, message: "files required" }, 400);

  const creds = {
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  };
  const s3 = new S3Client(creds);

  const grants: Array<{ key: string; url: string }> = [];
  for (let i = 0; i < files; i++) {
    const key = `${newId()}.jpg`;
    const cmd = new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key });
    // Generate presigned URL
    const url = await import("@aws-sdk/s3-request-presigner").then(({ getSignedUrl }) =>
      getSignedUrl(s3, cmd, { expiresIn: 60 * 5 })
    );
    grants.push({ key, url });
  }

  return json({ ok: true, items: grants });
};
