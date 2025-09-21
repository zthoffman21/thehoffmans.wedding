import { useEffect, useRef, useState } from "react";
import Masonry from "../components/Masonry";

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

export default function Gallery() {
  const [items, setItems] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  async function fetchMore() {
    setLoading(true);
    const res = await fetch(`/api/gallery?limit=40${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    const json = await res.json();
    const normalized = (json.items as any[]).map((p) => ({
      key: p.key ?? p.id,            // fallback if backend still sends "id"
      width: p.width,
      height: p.height,
      caption: p.caption,
      display_name: p.display_name,
    })) as Photo[];

    setItems((i) => [...i, ...normalized]);
    setCursor(json.nextCursor ?? null);
    setLoading(false);
  }

  useEffect(() => { fetchMore(); }, []);
  useEffect(() => {
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && !loading && cursor !== null) fetchMore();
      },
      { rootMargin: "800px" }
    );
    if (moreRef.current) io.observe(moreRef.current);
    return () => io.disconnect();
  }, [loading, cursor]);

  return (
    <section className="container-px py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Shared Album</h1>
        <a href="/gallery/upload" className="rounded-xl px-3 py-2 bg-ink/90 text-ink">Add photos</a>
      </header>

      <Masonry>
        {items.map((p) => (
          <figure key={p.key} className="mb-4 break-inside-avoid">
            <img
              className="w-full h-auto rounded-xl bg-neutral-200 object-cover"
              loading="lazy"
              src={cfImg(p.key, 900)}
              srcSet={`
                ${cfImg(p.key, 480, 70)} 480w,
                ${cfImg(p.key, 900, 75)} 900w,
                ${cfImg(p.key, 1400, 75)} 1400w
              `}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
              alt={p.caption || "Wedding photo"}
              style={p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined}
            />
            {(p.caption || p.display_name) && (
              <figcaption className="mt-1 text-xs text-ink/70">
                {p.caption} {p.display_name ? `— ${p.display_name}` : ""}
              </figcaption>
            )}
          </figure>
        ))}
      </Masonry>

      <div ref={moreRef} className="h-10" />
      {loading && <p className="text-center text-ink/60 mt-4">Loading…</p>}
    </section>
  );
}