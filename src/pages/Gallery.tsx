import { useEffect, useRef, useState } from "react";
import Masonry from "../components/Masonry";
import GalleryUploadInline from "./GalleryUploadInline";

/* --------------------------------- Types --------------------------------- */
type Photo = {
    key: string;
    width?: number;
    height?: number;
    caption?: string;
    display_name?: string;
};

/* ------------------------------ Image helpers ----------------------------- */
const IMG_ORIGIN = import.meta.env.VITE_IMG_PUBLIC_ORIGIN;
function cfImg(key: string, w: number, q = 75) {
    return `/cdn-cgi/image/width=${w},quality=${q},format=auto/${IMG_ORIGIN}/${encodeURI(key)}`;
}
function rawImgUrl(key: string) {
    return `/${IMG_ORIGIN}/${encodeURI(key)}`;
}

function filenameFromKey(key: string) {
    try {
        return decodeURI(key.split("/").pop() || "photo.jpg");
    } catch {
        return key.split("/").pop() || "photo.jpg";
    }
}

// Basic iOS detection to pick friendliest UX
const IS_IOS =
  typeof navigator !== "undefined" &&
  (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1) 
  );

// Unified save handler: Share on iOS, download elsewhere, open-tab fallback
async function handleSave(key: string) {
    const url = rawImgUrl(key);
    const name = filenameFromKey(key);

    try {
        // Try Web Share with a File (best iOS UX if supported)
        if (navigator.share && (navigator as any).canShare) {
            const resp = await fetch(url, { mode: "cors" });
            const blob = await resp.blob();
            const file = new File([blob], name, { type: blob.type || "image/jpeg" });
            if ((navigator as any).canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: "Save photo" });
                return;
            }
        }
    } catch {
        // ignore and try next fallback
    }

    if (!IS_IOS) {
        // Non-iOS: trigger a download programmatically
        try {
            const resp = await fetch(url, { mode: "cors" });
            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            return;
        } catch {
            // fall through to open
        }
    }

    // Last resort (especially iOS older versions): open full image to long-press save
    window.open(url, "_blank", "noopener");
}

/* -------------------------------- Component ------------------------------- */
export default function Gallery() {
    const [items, setItems] = useState<Photo[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const [showUpload, setShowUpload] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    // guards + single observer instance
    const isFetchingRef = useRef(false);
    const ioRef = useRef<IntersectionObserver | null>(null);

    // Fetch next page (requires cursor !== null)
    async function fetchMore() {
        if (isFetchingRef.current) return;
        if (cursor === null) return; // end reached

        isFetchingRef.current = true;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/gallery?limit=40${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`
            );
            const json = await res.json();

            const normalized = (json.items as any[]).map((p) => ({
                key: p.key ?? p.id,
                width: p.width,
                height: p.height,
                caption: p.caption,
                display_name: p.display_name,
            })) as Photo[];

            setItems((i) => [...i, ...normalized]);
            const next = json.nextCursor || null;
            setCursor(next);

            if (next === null && ioRef.current && moreRef.current) {
                ioRef.current.unobserve(moreRef.current);
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }

    // Initial page (does NOT require cursor)
    useEffect(() => {
        (async () => {
            isFetchingRef.current = true;
            setLoading(true);
            try {
                const res = await fetch(`/api/gallery?limit=40`);
                const json = await res.json();

                const normalized = (json.items as any[]).map((p) => ({
                    key: p.key ?? p.id,
                    width: p.width,
                    height: p.height,
                    caption: p.caption,
                    display_name: p.display_name,
                })) as Photo[];

                setItems(normalized);
                setCursor(json.nextCursor || null);
                setInitialLoaded(true);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        })();
    }, []);

    // Single IntersectionObserver wired to the sentinel
    useEffect(() => {
        if (!moreRef.current) return;

        ioRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                // Only fetch when: visible, not already fetching, and there IS a next page
                if (entry.isIntersecting && !isFetchingRef.current && cursor !== null) {
                    fetchMore();
                }
            },
            { rootMargin: "800px" }
        );

        ioRef.current.observe(moreRef.current);
        return () => {
            ioRef.current?.disconnect();
            ioRef.current = null;
        };
    }, [cursor]); // re-evaluate when cursor changes (e.g., becomes null)
    return (
        <section
            className="container-px pb-12 pt-4 text-[#FAF7EC]"
            style={{
                background: "#203648",
                minHeight: "100dvh",
            }}
        >
            {/* Sticky header */}
            <header
                className="sticky top-0 z-30 -mx-[var(--container-px,0)] mb-4
             relative bg-transparent px-[var(--container-px,1rem)] py-3 backdrop-blur"
            >
                <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <span className="rounded-lg bg-white/10 px-2 py-1 ring-1 ring-white/10">
                        Shared Album
                    </span>

                    {/* Action-style, flipped colors */}
                    <button
                        onClick={() => setShowUpload(true)}
                        className="rounded-lg bg-[#FAF7EC] px-3 py-1.5 font-medium text-[#203648] shadow-sm ring-1 ring-white/20 transition
                       hover:bg-white/95 hover:shadow-md active:scale-[0.98]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        aria-label="Add photos"
                    >
                        + Add photos
                    </button>
                </div>
            </header>

            {/* Skeletons while first page loads */}
            {!initialLoaded && (
                <Masonry>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={`sk-${i}`}
                            className="mb-4 h-64 animate-pulse break-inside-avoid rounded-xl bg-white/10 ring-1 ring-white/10"
                        />
                    ))}
                </Masonry>
            )}

            {/* Image grid */}
            {initialLoaded && (
                <Masonry>
                    {items.map((p) => (
                        <figure key={p.key} className="mb-4 break-inside-avoid">
                            <div className="relative overflow-hidden rounded-xl shadow-sm ring-1 ring-white/10">
                                <img
                                    className="h-auto w-full object-cover transition will-change-transform hover:scale-[1.01]"
                                    loading="lazy"
                                    src={cfImg(p.key, 900)}
                                    srcSet={`${cfImg(p.key, 480, 70)} 480w, ${cfImg(
                                        p.key,
                                        900,
                                        75
                                    )} 900w, ${cfImg(p.key, 1400, 75)} 1400w`}
                                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                                    alt={p.caption || "Wedding photo"}
                                    style={
                                        p.width && p.height
                                            ? { aspectRatio: `${p.width} / ${p.height}` }
                                            : undefined
                                    }
                                />

                                {/* Caption gradient (if present) */}
                                {(p.caption || p.display_name) && (
                                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-[11px] text-white/90">
                                        {p.caption} {p.display_name ? `— ${p.display_name}` : ""}
                                    </figcaption>
                                )}

                                {/* Download button */}
                                <button
                                    onClick={() => handleSave(p.key)}
                                    title="Save"
                                    aria-label="Save image"
                                    className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md
             bg-black/55 px-2 py-1 text-[11px] text-white ring-1 ring-white/25
             backdrop-blur transition hover:bg-black/70 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-white/50"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="size-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span className="hidden sm:inline">Save</span>
                                </button>
                            </div>
                        </figure>
                    ))}
                </Masonry>
            )}

            {/* Infinite scroll sentinel & loader */}
            <div ref={moreRef} className="h-10" />
            {loading && initialLoaded && <p className="mt-4 text-center text-white/70">Loading…</p>}

            {/* Upload modal */}
            {showUpload && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Upload photos"
                    onClick={(e) => {
                        if (e.currentTarget === e.target) setShowUpload(false);
                    }}
                >
                    <div className="w-full max-w-xl rounded-2xl bg-[#203648] p-4 text-[#FAF7EC] shadow-2xl ring-1 ring-white/10">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Upload photos</h2>
                            <button
                                onClick={() => setShowUpload(false)}
                                className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                aria-label="Close upload"
                            >
                                ✕
                            </button>
                        </div>
                        <GalleryUploadInline onDone={() => setShowUpload(false)} />
                    </div>
                </div>
            )}
        </section>
    );
}
