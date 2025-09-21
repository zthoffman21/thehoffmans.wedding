import { useState } from "react";

type UploadGrant = { id: string; uploadURL: string };

export default function GalleryUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files?.length) return;
    setBusy(true);
    setProgress(0);

    const turnstileToken = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    // 2) Ask server for N direct uploads
    const grantsRes = await fetch("/api/gallery/direct-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnstileToken, files: files.length })
    }).then(r => r.json() as Promise<{ ok: boolean; items?: UploadGrant[]; granted?: number; message?: string }>);
    if (!grantsRes.ok || !grantsRes.items?.length) throw new Error(grantsRes.message || "Could not get upload URLs");

    // 3) Upload each file
    const metas: Array<{ imageId: string; caption?: string; display_name?: string; width?: number; height?: number }> = [];
    let done = 0;
    for (let i = 0; i < grantsRes.items.length; i++) {
      const g = grantsRes.items[i];
      const f = files[i];
      // Upload; Cloudflare Images accepts multipart/form-data ("file") or raw; direct_upload often expects form "file"
      const form = new FormData();
      form.append("file", f, f.name);
      const resp = await fetch(g.uploadURL, { method: "POST", body: form }).then(r => r.json() as any);
      if (!resp?.result?.id) throw new Error("Upload failed");

      // width/height best-effort (for layout); optional
      const dims = await readImgDims(f).catch(() => ({ w: undefined, h: undefined }));
      metas.push({ imageId: resp.result.id, caption, display_name: name, width: dims.w, height: dims.h });

      done++;
      setProgress(Math.round((done / grantsRes.items.length) * 100));
    }

    // 4) Confirm metadata
    const conf = await fetch("/api/gallery/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: metas })
    }).then(r => r.json());
    if (!conf.ok) throw new Error(conf.message || "Confirm failed");

    setBusy(false);
    setProgress(100);
    alert(conf.status === "approved" ? "Uploaded! 🎉" : "Uploaded! Pending approval.");
  }

  return (
    <section className="container-px py-8 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Add photos</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
        <input className="w-full rounded border p-2" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Caption for this batch (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <button className="rounded-xl px-3 py-2 bg-ink/90 text-white disabled:opacity-50" disabled={busy}>
          {busy ? `Uploading… ${progress}%` : "Upload"}
        </button>
      </form>
    </section>
  );
}

function readImgDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.width, h: img.height });
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
