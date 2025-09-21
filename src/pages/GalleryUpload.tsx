import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        turnstile?: {
            render: (el: Element, opts: any) => string;
            remove: (id: string) => void;
            reset: (id: string) => void;
            execute: (id: string) => void;
            ready?: (cb: () => void) => void;
        };
    }
}

type UploadGrant = { key: string; uploadURL: string; contentType: string };

export default function GalleryUpload() {
    const [files, setFiles] = useState<FileList | null>(null);
    const [name, setName] = useState("");
    const [caption, setCaption] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const [tsLoaded, setTsLoaded] = useState<boolean>(false);
    const [tsError, setTsError] = useState<string | null>(null);

    const tsElRef = useRef<HTMLDivElement | null>(null);
    const tsIdRef = useRef<string | null>(null);
    const pendingResolverRef = useRef<((t: string) => void) | null>(null);

    /* -------------------- Turnstile safe loader -------------------- */
    useEffect(() => {
        const SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "");
        if (!SITE_KEY) {
            setTsError("Turnstile site key missing.");
            return;
        }
        if (!tsElRef.current) return;

        const src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        const onLoad = () => {
            if (!window.turnstile) {
                setTsError("Turnstile failed to load.");
                return;
            }
            try {
                if (tsIdRef.current) {
                    try {
                        window.turnstile.remove(tsIdRef.current);
                    } catch {}
                    tsIdRef.current = null;
                }
                if (tsElRef.current && tsElRef.current.firstChild) {
                    tsElRef.current.innerHTML = ""; // ensure empty container
                }

                tsIdRef.current = window.turnstile.render(tsElRef.current!, {
                    sitekey: SITE_KEY,
                    size: "invisible",
                    callback: (t: string) => {
                        pendingResolverRef.current?.(t);
                        pendingResolverRef.current = null;
                    },
                    "error-callback": () => {
                        pendingResolverRef.current?.(new Error("Turnstile error") as any);
                        pendingResolverRef.current = null;
                    },
                    "timeout-callback": () => {
                        pendingResolverRef.current?.(new Error("Turnstile timeout") as any);
                        pendingResolverRef.current = null;
                    },
                });
                setTsLoaded(true);
            } catch (e) {
                console.error(e);
                setTsError("Turnstile init error.");
            }
        };

        if (!script) {
            script = document.createElement("script");
            script.src = src;
            script.onload = onLoad;
            script.onerror = () => setTsError("Turnstile script blocked/failed.");
            document.head.appendChild(script);
        } else if ((script as any)._loaded) {
            onLoad();
        } else {
            script.addEventListener("load", onLoad, { once: true });
        }

        // mark loaded (helps if navigating away/back)
        (script as any)._loaded = true;

        return () => {
            if (tsIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(tsIdRef.current);
                } catch {}
            }
            tsIdRef.current = null;
        };
    }, []);

    function getTurnstileToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!window.turnstile || !tsIdRef.current) {
                return reject(new Error("Human-check not available."));
            }
            pendingResolverRef.current = (value: string) => {
                if (typeof value === "string") resolve(value);
                else reject(value as any);
            };
            try {
                window.turnstile.execute(tsIdRef.current);
            } catch (e) {
                pendingResolverRef.current = null;
                reject(e);
            }
            setTimeout(() => {
                if (pendingResolverRef.current) {
                    pendingResolverRef.current = null;
                    reject(new Error("Human-check timed out."));
                }
            }, 60000);
        });
    }

    function resetTurnstile() {
        if (window.turnstile && tsIdRef.current) {
            try {
                window.turnstile.reset(tsIdRef.current);
            } catch {}
        }
    }

    /* ------------------------ Submit flow -------------------------- */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!files?.length) return;

        try {
            setBusy(true);
            setProgress(0);

            // 1) Require Turnstile success before presign
            const token1 = await getTurnstileToken();

            // 2) Get presigned URLs
            const payload = {
                token: token1,
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

            // 3) Upload
            const metas: Array<{
                imageId: string;
                caption?: string;
                display_name?: string;
                width?: number;
                height?: number;
            }> = [];

            for (let i = 0; i < grants.items.length; i++) {
                const g = grants.items[i]!;
                const f = files[i]!;

                const put = await fetch(g.uploadURL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": g.contentType || f.type || "application/octet-stream",
                    },
                    body: f,
                });
                if (!put.ok) throw new Error(`Upload failed for ${f.name}`);

                const dims = await readImgDims(f).catch(() => ({ w: undefined, h: undefined }));
                metas.push({
                    imageId: g.key,
                    caption: caption || undefined,
                    display_name: name || undefined,
                    width: dims.w,
                    height: dims.h,
                });

                setProgress(Math.round(((i + 1) / grants.items.length) * 100));
            }

            // 4) Confirm (optional second Turnstile)
            let token2: string | undefined;
            try {
                token2 = await getTurnstileToken();
            } catch {
                // ignore if /confirm doesn't require it
            }

            const confResp = await fetch("/api/gallery/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(token2 ? { photos: metas, token: token2 } : { photos: metas }),
            });
            const conf = await confResp.json();
            if (!confResp.ok || !conf?.ok) throw new Error(conf?.message || "Confirm failed");

            setProgress(100);
            setBusy(false);
            resetTurnstile();
            alert(conf.status === "approved" ? "Uploaded! 🎉" : "Uploaded! Pending approval.");
            setFiles(null);
            setName("");
            setCaption("");
            setTimeout(() => setProgress(0), 800);
        } catch (err: any) {
            setBusy(false);
            resetTurnstile();
            setError(err?.message || String(err));
            console.error(err);
        }
    }

    return (
        <section className="container-px py-8 max-w-xl">
            <h1 className="text-2xl font-semibold mb-4">Add photos</h1>

            {/* Render the widget container either way; we only initialize if script loads */}
            <div ref={tsElRef} className="cf-turnstile" aria-hidden />

            {tsError && (
                <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-700">
                    {tsError}
                </div>
            )}

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
                    className="rounded-xl px-3 py-2 bg-ink/90 text-white disabled:opacity-50"
                    disabled={busy || !!tsError || !tsLoaded}
                    title={
                        !tsLoaded ? "Human-check is loading…" : tsError ? "Human-check blocked" : ""
                    }
                >
                    {busy ? `Uploading… ${progress}%` : "Upload"}
                </button>

                {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
        </section>
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
