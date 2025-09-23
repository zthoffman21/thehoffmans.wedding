import { useState } from "react";

type UploadGrant = { key: string; uploadURL: string; contentType: string };

function safeFilename(s: string) {
    return s
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
function friendlyName({ nameHint, original }: { nameHint?: string; original: string }) {
    const base =
        (nameHint && safeFilename(nameHint)) ||
        (original.split(".")[0] ? safeFilename(original.split(".")[0]!) : "photo");
    const ext = original.includes(".") ? "." + original.split(".").pop() : ".jpg";
    return `${base}${ext}`;
}

export default function GalleryUploadInline({ onDone }: { onDone?: () => void }) {
    const [files, setFiles] = useState<FileList | null>(null);
    const [name, setName] = useState("");
    const [caption, setCaption] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!files?.length) return;

        try {
            setBusy(true);
            setProgress(0);

            // 1) Get presigned URLs (rate limited on server)
            const payload = {
                items: Array.from(files).map((f) => ({
                    filename: f.name,
                    contentType: f.type || "application/octet-stream",
                    size: f.size,
                })),
            };

            const grantsResp = await fetch("/api/gallery/direct-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const grants = (await grantsResp.json()) as {
                ok: boolean;
                items?: UploadGrant[];
                message?: string;
            };
            if (!grantsResp.ok || !grants.ok || !grants.items?.length) {
                throw new Error(grants.message || "Could not get upload URLs");
            }

            // 2) Upload each file to R2
            const metas: Array<{
                imageId: string;
                caption?: string;
                display_name?: string;
                width?: number;
                height?: number;
                download_name?: string;
            }> = [];

            for (let i = 0; i < grants.items.length; i++) {
                const g = grants.items[i]!;
                const f = files[i]!;

                try {
                    const put = await fetch(g.uploadURL, {
                        method: "PUT",
                        headers: {
                            "Content-Type": g.contentType || f.type || "application/octet-stream",
                        },
                        body: f,
                    });
                    if (!put.ok) throw new Error(`Upload failed (${put.status}) for ${f.name}`);
                } catch (e: any) {
                    // Normalize the classic vague browser error
                    const raw = e?.message || String(e);
                    const msg = /Failed to fetch/i.test(raw)
                        ? `Network / CORS error while uploading "${f.name}". Please retry upload.`
                        : `${raw}. Please retry upload.`;
                    throw new Error(msg);
                }

                const dims = await readImgDims(f).catch(() => ({ w: undefined, h: undefined }));
                metas.push({
                    imageId: g.key,
                    caption: caption || undefined,
                    display_name: name || undefined,
                    width: dims.w,
                    height: dims.h,
                    download_name: friendlyName({ nameHint: caption || name, original: f.name }),
                });

                setProgress(Math.round(((i + 1) / grants.items.length) * 100));
            }

            const confResp = await fetch("/api/gallery/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photos: metas }),
            });
            const conf = await confResp.json();
            if (!confResp.ok || !conf?.ok) throw new Error(conf?.message || "Confirm failed");

            setProgress(100);
            setBusy(false);
            alert(conf.status === "approved" ? "Uploaded! 🎉" : "Uploaded! Pending approval.");
            setFiles(null);
            setName("");
            setCaption("");
            setTimeout(() => setProgress(0), 800);
            onDone?.();
        } catch (err: any) {
            setBusy(false);
            setError(err?.message || String(err));
            console.error(err);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
            />
            <input
                className="w-full rounded border p-2"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                className="w-full rounded border p-2"
                placeholder="Caption for this batch (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            />

            <button
                type="submit"
                className="rounded-xl px-3 py-2 bg-ink/90 text-ink disabled:opacity-50"
                disabled={busy}
            >
                {busy ? `Uploading… ${progress}%` : "Upload"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
    );
}

function readImgDims(file: File): Promise<{ w: number; h: number }> {
    return new Promise((res, rej) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            res({ w: img.width, h: img.height });
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            rej(e);
        };
        img.src = url;
    });
}
