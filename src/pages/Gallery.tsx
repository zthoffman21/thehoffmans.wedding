import { useEffect, useRef, useState } from "react";
import Masonry from "../components/Masonry";
import GalleryUploadInline from "./GalleryUploadInline";
import { size } from "zod";

/* --------------------------------------------------------------
   Types & helpers
----------------------------------------------------------------*/
type Photo = {
  key: string;
  width?: number;
  height?: number;
  caption?: string;
  display_name?: string;
};

const IMG_ORIGIN = import.meta.env.VITE_IMG_PUBLIC_ORIGIN;

function cfImg(key: string, w: number, q = 75) {
  return `/cdn-cgi/image/width=${w},quality=${q},format=auto/${IMG_ORIGIN}/${encodeURI(key)}`;
}

// Stable hash to choose a frame for each image
function hashIndex(s: string, mod = 4) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

/* --------------------------------------------------------------
   Classic Museum Frames (4 ornate variants)
   - Each is an overlay placed above the photo + mat.
   - Designed to feel less modern and more traditional/gilded.
----------------------------------------------------------------*/
function FrameOverlayOrnate1() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <defs>
        <linearGradient id="goldA" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6e7b2" />
          <stop offset="45%" stopColor="#caa756" />
          <stop offset="100%" stopColor="#f3d98a" />
        </linearGradient>
        <radialGradient id="bevelA" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#c49d4a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8a6a2f" stopOpacity="0.9" />
        </radialGradient>
        <pattern id="filigreeA" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3h6M3 0v6" stroke="#b7923e" strokeWidth="0.4" opacity="0.35" />
        </pattern>
      </defs>
      <rect x="1.5" y="1.5" width="97" height="97" rx="4" fill="url(#bevelA)" stroke="url(#goldA)" strokeWidth="2.2" />
      <rect x="6" y="6" width="88" height="88" rx="2" fill="none" stroke="url(#goldA)" strokeWidth="1.2" />
      <rect x="3.6" y="3.6" width="92.8" height="92.8" rx="3" fill="url(#filigreeA)" opacity="0.5" />
    </svg>
  );
}
function FrameOverlayOrnate2() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <defs>
        <linearGradient id="goldB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f7e9c0" />
          <stop offset="50%" stopColor="#c89a3c" />
          <stop offset="100%" stopColor="#a9782a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="2" fill="#b4872e" />
      <rect x="2" y="2" width="96" height="96" rx="2" fill="none" stroke="url(#goldB)" strokeWidth="2.4" />
      <path d="M8 8h84v84H8z" fill="none" stroke="#f2dec1" strokeWidth="0.8" />
      <g stroke="#6f531c" opacity="0.45">
        <path d="M8 14h84M8 86h84M14 8v84M86 8v84" />
      </g>
    </svg>
  );
}
function FrameOverlayOrnate3() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <defs>
        <linearGradient id="goldC" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#8a6f2a" />
          <stop offset="50%" stopColor="#d5b36a" />
          <stop offset="100%" stopColor="#fff2c7" />
        </linearGradient>
      </defs>
      <path d="M4 18 Q18 4 34 4 H66 Q82 4 96 18 V82 Q96 96 82 96 H18 Q4 96 4 82 Z" fill="#a67b28" stroke="url(#goldC)" strokeWidth="2.2" />
      <path d="M10 24 Q22 12 34 12 H66 Q78 12 90 24 V76 Q90 88 78 88 H22 Q10 88 10 76 Z" fill="none" stroke="#ead7aa" strokeWidth="1.2" />
    </svg>
  );
}
function FrameOverlayOrnate4() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <defs>
        <linearGradient id="goldD" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f1dfb0" />
          <stop offset="50%" stopColor="#c59b41" />
          <stop offset="100%" stopColor="#8c6a2b" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="97" height="97" fill="#b88a33" stroke="url(#goldD)" strokeWidth="2.2" />
      <g stroke="#e9d6ae" strokeWidth="0.9">
        <rect x="6" y="6" width="88" height="88" />
        <rect x="9" y="9" width="82" height="82" />
      </g>
      <g stroke="#6b5120" opacity="0.55">
        <circle cx="6" cy="6" r="1.2" />
        <circle cx="94" cy="6" r="1.2" />
        <circle cx="6" cy="94" r="1.2" />
        <circle cx="94" cy="94" r="1.2" />
      </g>
    </svg>
  );
}

const FRAME_COMPONENTS = [
  FrameOverlayOrnate1,
  FrameOverlayOrnate2,
  FrameOverlayOrnate3,
  FrameOverlayOrnate4,
];

/* --------------------------------------------------------------
   PictureFrame component
   - Adds a cotton mat around the image
   - Adds "hanging wires" to the top rail for a museum vibe
   - Adds a brass plaque-style caption
----------------------------------------------------------------*/
function PictureFrame({ idx, children, caption, contributor }: { idx: number; children: React.ReactNode; caption?: string; contributor?: string; }) {
  const Overlay = FRAME_COMPONENTS[idx] ?? FrameOverlayOrnate1;
  return (
    <figure className="group relative mb-10 break-inside-avoid">
      {/* hanger wires */}
      <div className="pointer-events-none absolute -top-14 left-1/2 h-14 w-0 -translate-x-1/2">
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/50 to-white/5" />
      </div>

      {/* frame */}
      <div className="relative rounded-[18px] bg-[#0b1326]/60 p-3 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.9)] ring-1 ring-black/40">
        {/* inner mat */}
        <div className="relative overflow-hidden rounded-[10px] bg-[#f5efe3] p-2">
          <div className="relative overflow-hidden rounded-[6px] bg-[#0f1a2e]">
            {children}
            <Overlay />
          </div>
        </div>
      </div>

      {/* brass plaque */}
      {(caption || contributor) && (
        <figcaption className="mx-auto -mt-3 w-max rounded-md border border-[#a37f36]/40 bg-gradient-to-b from-[#f5e7c6] to-[#d4b676] px-3 py-1 text-[11px] text-[#4a3a12] shadow-sm">
          <span className="font-medium">{caption || "Untitled"}</span>
          {contributor && <span className="opacity-80"> — {contributor}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/* --------------------------------------------------------------
   Decorative rail across the top (wood)
----------------------------------------------------------------*/
function HangingRail() {
  return (
    <div className="sticky top-0 z-10 h-6 w-full bg-gradient-to-b from-[#5a3f22] via-[#7a5731] to-[#2f2318] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.8)]" />
  );
}

/* --------------------------------------------------------------
   Main component
----------------------------------------------------------------*/
export default function Gallery() {
  const [items, setItems] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  async function fetchMore() {
    setLoading(true);
    const res = await fetch(`/api/gallery?limit=40${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    const json = await res.json();
    const normalized = (json.items as any[]).map((p) => ({
      key: p.key ?? p.id,
      width: p.width,
      height: p.height,
      caption: p.caption,
      display_name: p.display_name,
    })) as Photo[];

    setItems((i) => [...i, ...normalized]);
    setCursor(json.nextCursor ?? null);
    setLoading(false);
  }

  useEffect(() => {
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && !loading && cursor !== null) fetchMore();
      },
      { rootMargin: "800px" }
    );
    if (moreRef.current) io.observe(moreRef.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cursor]);

  return (
    <section
      className="relative min-h-[100dvh] overflow-hidden"
      style={{
        // Deep blue museum wall with soft vignette
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.06), transparent), linear-gradient(180deg, #0c1a2b 0%, #0b1726 45%, #0a1422 100%)",
      }}
    >
      <HangingRail />

      {/* Top banner / CTA */}
      <div className="container-px">
        <header className="mx-auto mb-6 mt-8 flex max-w-6xl flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-neutral-200 backdrop-blur-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Exhibition Hall</h1>
            <p className="mt-1 max-w-prose text-sm text-neutral-300/85">
              Step into our collection of wedding-day moments. If you captured something we missed, please
              add it—this gallery is better with your art.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 font-medium text-[#0b1726] shadow-sm ring-1 ring-black/10 transition hover:bg-white"
            >
              Share your photos
            </button>
          </div>
        </header>
      </div>

      {/* Grid */}
      <div className="container-px">
        <Masonry>
          {items.map((p) => {
            const idx = hashIndex(p.key, 4);
            return (
              <PictureFrame
                key={p.key}
                idx={idx}
                caption={p.caption || undefined}
                contributor={p.display_name || undefined}
              >
                <img
                  className="block h-auto w-full object-cover"
                  loading="lazy"
                  src={cfImg(p.key, 1100)}
                  srcSet={`
                    ${cfImg(p.key, 520, 70)} 520w,
                    ${cfImg(p.key, 900, 75)} 900w,
                    ${cfImg(p.key, 1400, 75)} 1400w
                  `}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22vw"
                  alt={p.caption || "Wedding photo"}
                  style={p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined}
                />
              </PictureFrame>
            );
          })}
        </Masonry>

        <div ref={moreRef} className="h-10" />
        {loading && <p className="mt-4 text-center text-neutral-300/70">Loading…</p>}
      </div>

      {/* Floating share CTA for small screens */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#0b1726] shadow-lg ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white md:hidden"
        aria-label="Share your photos"
      >
        ➕ Share yours
      </button>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0d1a2b] p-4 text-neutral-200 shadow-2xl ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Upload photos</h2>
              <button onClick={() => setShowUpload(false)} className="text-neutral-300/80 hover:text-white">✕</button>
            </div>
            <p className="mb-3 text-sm text-neutral-300/80">
              We accept phone and camera photos. Large files are okay—images are optimized automatically.
            </p>
            <GalleryUploadInline onDone={() => setShowUpload(false)} />
          </div>
        </div>
      )}
    </section>
  );
}
