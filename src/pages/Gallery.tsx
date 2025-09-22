import { useEffect, useRef, useState } from "react";
import Masonry from "../components/Masonry";
import GalleryUploadInline from "./GalleryUploadInline";

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

// Small stable hash to choose a frame for each image
function hashIndex(s: string, mod = 4) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

/* --------------------------------------------------------------
   Picture Frame SVGs (4 variants)
   Each frame draws in an absolute overlay, while the photo sits below.
----------------------------------------------------------------*/
function FrameOverlay1() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <rect x="2" y="2" width="96" height="96" rx="4" ry="4" fill="none" stroke="url(#g1)" strokeWidth="3"/>
      <rect x="6" y="6" width="88" height="88" rx="3" ry="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#d4b88a"/>
          <stop offset="50%" stopColor="#8a6a3d"/>
          <stop offset="100%" stopColor="#d9c7a1"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
function FrameOverlay2() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke="#a4b4c8" strokeWidth="3"/>
      <rect x="5" y="5" width="90" height="90" fill="none" stroke="#6f819a" strokeWidth="1.2" strokeDasharray="2 2"/>
      <rect x="9" y="9" width="82" height="82" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
    </svg>
  );
}
function FrameOverlay3() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <path d="M3 12 Q12 3 25 3 H75 Q88 3 97 12 V88 Q97 97 88 97 H12 Q3 97 3 88 Z" fill="none" stroke="#c7a36e" strokeWidth="3"/>
      <path d="M8 18 Q18 8 28 8 H72 Q82 8 92 18 V82 Q92 92 82 92 H18 Q8 92 8 82 Z" fill="none" stroke="#6b5434" strokeWidth="1.4"/>
    </svg>
  );
}
function FrameOverlay4() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="#e5d8b8" strokeWidth="2.5"/>
      <g stroke="#bfa873" strokeWidth="1">
        <line x1="2" y1="18" x2="98" y2="18" />
        <line x1="2" y1="82" x2="98" y2="82" />
        <line x1="18" y1="2" x2="18" y2="98" />
        <line x1="82" y1="2" x2="82" y2="98" />
      </g>
    </svg>
  );
}

const FRAME_COMPONENTS = [FrameOverlay1, FrameOverlay2, FrameOverlay3, FrameOverlay4];

function PictureFrame({
  idx,
  children,
  caption,
}: {
  idx: number;
  children: React.ReactNode;
  caption?: string;
}) {
  const Overlay = FRAME_COMPONENTS[idx] ?? FrameOverlay1;
  return (
    <figure className="group relative mb-6 break-inside-avoid rounded-[18px] bg-[#0c1527]/40 p-3 shadow-[0_6px_40px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/5 transition-transform duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_46px_-16px_rgba(0,0,0,0.9)]">
      {/* inner artboard */}
      <div className="relative overflow-hidden rounded-[10px]">
        {children}
        <Overlay />
      </div>
      {caption && (
        <figcaption className="mt-2 px-1 text-[11px] leading-snug text-neutral-300/80">
          {caption}
        </figcaption>
      )}
    </figure>
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
        // Deep midnight with a subtle vignette + noise for an art-gallery mood
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.06), transparent), linear-gradient(180deg, #0a1220 0%, #0a1220 45%, #0b0f1a 100%)",
      }}
    >
      {/* Top banner / CTA */}
      <div className="container-px">
        <header className="mx-auto mb-6 mt-8 flex max-w-6xl flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-neutral-200 backdrop-blur-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">The Gallery</h1>
            <p className="mt-1 max-w-prose text-sm text-neutral-300/85">
              A curated wall of memories from our celebration. Wander, linger, and enjoy the art.
              Want to contribute your shots? Add them below—everyone’s perspective belongs here.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 font-medium text-[#0a1220] shadow-sm ring-1 ring-black/10 transition hover:bg-white"
            >
              <span aria-hidden>➕</span> Share your photos
            </button>
          </div>
        </header>
      </div>

      {/* Grid */}
      <div className="container-px">
        <Masonry>
          {items.map((p) => {
            const idx = hashIndex(p.key, 4);
            const person = p.display_name ? `— ${p.display_name}` : "";
            const captionText = (p.caption || "") + person;
            return (
              <PictureFrame key={p.key} idx={idx} caption={captionText || undefined}>
                <img
                  className="block h-auto w-full bg-[#0f1a2e] object-cover"
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
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#0a1220] shadow-lg ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white md:hidden"
        aria-label="Share your photos"
      >
        ➕ Share yours
      </button>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0c1322] p-4 text-neutral-200 shadow-2xl ring-1 ring-white/10">
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
