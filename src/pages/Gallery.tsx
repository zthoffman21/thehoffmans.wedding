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
const ALBUMS = [
    { id: "album_general", label: "General" },
    { id: "album_ceremony", label: "Ceremony" },
    { id: "album_reception", label: "Reception" },
    { id: "album_friends_family", label: "Friends & Family" },
    { id: "album_details", label: "Details & Decor" },
    { id: "album_party", label: "Dance Floor / Party" },
] as const;
type AlbumId = (typeof ALBUMS)[number]["id"];
/* ------------------------------ Image helpers ----------------------------- */
const IMG_ORIGIN = import.meta.env.VITE_IMG_PUBLIC_ORIGIN;
function cfImg(key: string, w: number, q = 75) {
    return `/cdn-cgi/image/width=${w},quality=${q},format=auto/${IMG_ORIGIN}/${encodeURI(key)}`;
}
function filenameFromKey(key: string) {
    try {
        return decodeURI(key.split("/").pop() || "photo.jpg");
    } catch {
        return key.split("/").pop() || "photo.jpg";
    }
}

// TS-safe iOS / iPadOS detection
const IS_IOS =
    typeof navigator !== "undefined" &&
    (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

function apiFileUrl(key: string, opts?: { disposition?: "inline" | "attachment"; name?: string }) {
    const q = new URLSearchParams({ key });
    if (opts?.disposition) q.set("disposition", opts.disposition);
    if (opts?.name) q.set("name", opts.name);
    return `/api/gallery/file?${q.toString()}`;
}

async function handleSave(key: string) {
    const name = filenameFromKey(key);

    if (IS_IOS) {
        // Best path to Photos: open the image inline so the user can long-press → "Save Image"
        const viewUrl = apiFileUrl(key, { disposition: "inline", name });
        window.open(viewUrl, "_blank", "noopener");
        return;
    }

    // Desktop: use attachment so it downloads with the right filename
    const dlUrl = apiFileUrl(key, { disposition: "attachment", name });
    // Either navigate or synthesize a click to honor filename
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
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

    const [album, setAlbum] = useState<AlbumId>("album_general");

    // Fetch next page (requires cursor !== null)
    async function fetchMore() {
        if (isFetchingRef.current) return;
        if (cursor === null) return; // end reached

        isFetchingRef.current = true;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/gallery?limit=40${
                    cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
                }&album=${encodeURIComponent(album)}`
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
                const res = await fetch(
                    `/api/gallery?limit=40${
                        cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
                    }&album=${encodeURIComponent(album)}`
                );
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

    // Re-fetch first page whenever album changes
    useEffect(() => {
        let aborted = false;
        (async () => {
            isFetchingRef.current = true;
            setLoading(true);
            try {
                const res = await fetch(`/api/gallery?limit=40&album=${encodeURIComponent(album)}`);
                const json = await res.json();

                if (aborted) return;
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
                isFetchingRef.current = false;
                setLoading(false);
            }
        })();
        return () => {
            aborted = true;
        };
    }, [album]);

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
                background: "#243542",
                minHeight: "100dvh",
            }}
        >
            {/* Sticky header */}
            <header
                className="-top-[max(9dvh,env(safe-area-inset-top))] z-30 -mx-[var(--container-px,0)] mb-8
             bg-transparent px-[var(--container-px,1rem)] py-6 backdrop-blur"
            >
                <div className="mx-auto flex max-w-5xl flex-col items-center text-center text-[#F2EFE7]">
                    <h1 className="text-4xl font-semibold sm:text-5xl">Photo Gallery</h1>
                    <p className="mt-3 max-w-2xl text-base/7 opacity-95">
                        A shared photo album that allows everyone to share their favorite memories
                        of the day from their point of view.
                    </p>

                    <div className="mt-6 flex items-center gap-3 text-sm text-[#FAF7EC]/80">
                        <select
                            className="rounded-lg bg-[#FAF7EC]/10 px-2 py-1 ring-1 ring-[#FAF7EC]/10"
                            value={album}
                            onChange={(e) => {
                                setItems([]);
                                setCursor(null);
                                setInitialLoaded(false);
                                setAlbum(e.target.value as AlbumId);
                            }}
                            aria-label="Choose an album"
                        >
                            {ALBUMS.map((a) => (
                                <option
                                    className="text-[#203648] bg-[#FAF7EC]"
                                    key={a.id}
                                    value={a.id}
                                >
                                    {a.label}
                                </option>
                            ))}
                        </select>

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

                                {/* Download / Save affordance */}
                                {IS_IOS ? (
                                    // iOS/iPadOS: show hint, no click action
                                    <div
                                        className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white ring-1 ring-white/25 backdrop-blur"
                                        role="note"
                                        aria-label="Hold image to save to Photos"
                                    >
                                        Hold image to save
                                    </div>
                                ) : (
                                    // Desktop: keep real download
                                    <button
                                        onClick={() => handleSave(p.key)}
                                        title="Download"
                                        aria-label="Download image"
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
                                        <span className="hidden sm:inline">Download</span>
                                    </button>
                                )}
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
                        <GalleryUploadInline albumId={album} onDone={() => setShowUpload(false)} />
                    </div>
                </div>
            )}
        </section>
    );
}
