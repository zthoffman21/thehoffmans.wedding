import React from "react";

/* --------------------------------- Icons --------------------------------- */
const Icon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current">
    <path d={path} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconForkKnife = () => <Icon path="M8 3v8M6 3v8a2 2 0 0 0 2 2h0V3m6 0v18m0-10h5" />;
const IconCoffee = () => <Icon path="M3 10h13a3 3 0 0 1 0 6H6a3 3 0 0 1-3-3V7h14" />;
const IconHike = () => <Icon path="M9 6a2 2 0 1 1 4 0M7 22l3-8 3 4 4 4M3 22l4-10 4-2" />;

// Filled star (for Avery Recommended)
const IconStar = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="inline-block size-4 -mt-0.5">
    <path
      d="M12 3.5l2.85 5.78 6.38.93-4.61 4.49 1.09 6.36L12 18.9l-5.71 3.06 1.09-6.36-4.61-4.49 6.38-.93L12 3.5z"
      fill="#F2C94C"
      stroke="rgba(0,0,0,0.25)"
      strokeWidth="0.5"
    />
  </svg>
);

/* ------------------------------- Helpers --------------------------------- */
const BASE_LOCATION = "Columbus, OH";

type RecItem = {
  name: string;
  desc?: string;
  price?: "$" | "$$" | "$$$";
  tags?: string[];
  note?: string;
  avery?: boolean; // ⭐️
  mapsQuery?: string;
};

function buildMapsLink(item: RecItem) {
  const q = encodeURIComponent(item.mapsQuery ?? `${item.name} ${BASE_LOCATION}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/* --------------------------------- Page ---------------------------------- */
export default function Guide() {
  return (
    <section className="relative bg-[#F2EFE7] min-h-screen overflow-x-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
        style={{ backgroundImage: "url('/guide-bg.jpg?v=3')" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.20), transparent)," +
            "linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.28))",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-20">
        <header className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 text-center text-[#F2EFE7]">
          <p className="text-sm/6 tracking-widest uppercase opacity-90">In The Area</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Recommendations</h1>
          <p className="mt-4 max-w-2xl text-base/7 opacity-95">
            Places we love nearby—good eats, cozy coffee, and little adventures if you're making a weekend of it.
          </p>
        </header>

        {/* Main grid */}
        <main className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 px-4 pb-24 sm:mt-14 md:grid-cols-5">
          {/* LEFT column */}
          <div className="md:col-span-3 space-y-6">
            {/* Restaurants */}
            <Card>
              <CardHeader icon={<IconForkKnife />} title="Restaurants" subtitle="Date-night spots & casual bites" />
              <div className="mt-5 space-y-4">
                {restaurants.map((r) => (
                  <ListRow key={r.name} item={r} />
                ))}
              </div>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader icon={<IconHike />} title="Things to Do" subtitle="Outdoors, museums, and local gems" />
              <div className="mt-5 space-y-4">
                {activities.map((a) => (
                  <ListRow key={a.name} item={a} />
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT column */}
          <div className="md:col-span-2 space-y-6">
            {/* Coffee & Drinks */}
            <Card>
              <CardHeader icon={<IconCoffee />} title="Coffee & Drinks" />
              <div className="mt-5 space-y-4">
                {drinks.map((d) => (
                  <ListRow key={d.name} item={d} />
                ))}
              </div>
            </Card>

            {/* Legend / Key */}
            <Card>
              <CardHeader title="Legend" />
              <div className="mt-3 text-neutral-800 text-sm">
                <span className="inline-flex items-center gap-2">
                  <IconStar /> <span><strong>Avery Recommended</strong></span>
                </span>
              </div>
            </Card>

            {/* Hotels & Travel */}
            <Card>
              <CardHeader title="Hotels & Travel" />
              <div className="mt-3 space-y-4 text-sm text-neutral-800">
                <div>
                  <h3 className="font-semibold">Nearby Hotels</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "Hilton Columbus at Easton" })} target="_blank" rel="noreferrer">Hilton Columbus at Easton</a> - Modern stay, walkable to shopping & dining.</li>
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "Nationwide Hotel and Conference Center", mapsQuery: "Nationwide Hotel & Conference Center, Lewis Center, OH" })} target="_blank" rel="noreferrer">Nationwide Hotel & Conference Center</a> - Quiet retreat, ~15 min north of the city.</li>
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "Courtyard by Marriott Columbus Polaris" })} target="_blank" rel="noreferrer">Courtyard by Marriott Polaris</a> - Convenient for Polaris area.</li>
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "Hampton Inn Columbus-Sunbury" })} target="_blank" rel="noreferrer">Hampton Inn Sunbury/Columbus</a> - Closer budget-friendly option.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Airport Info</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "John Glenn Columbus International Airport", mapsQuery: "CMH airport" })} target="_blank" rel="noreferrer"><strong>John Glenn Columbus Intl. (CMH)</strong></a> - Primary airport (~25-30 min to north suburbs).</li>
                    <li><a className="underline hover:opacity-80" href={buildMapsLink({ name: "Rickenbacker International Airport", mapsQuery: "LCK airport" })} target="_blank" rel="noreferrer"><strong>Rickenbacker Intl. (LCK)</strong></a> - Limited commercial flights.</li>
                    <li>Uber/Lyft and car rentals are readily available at CMH.</li>
                  </ul>
                </div>
              </div>
            </Card>

          </div>
        </main>
      </div>
    </section>
  );
}

/* ------------------------------ Subcomponents ----------------------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#FAF7EC]/95 shadow-[0_6px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur-sm">
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function CardHeader({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex size-9 items-center justify-center rounded-xl bg-black/5 text-[#2C2A28]">{icon}</div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-[#2C2A28]">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-600">{subtitle}</p>}
      </div>
    </div>
  );
}

function ListRow({ item }: { item: RecItem }) {
  const href = buildMapsLink(item);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-black/5 bg-[#FAF7EC]/95 p-4 shadow-sm transition hover:ring-2 hover:ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      aria-label={`${item.name} on Google Maps`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">
              {item.name}{" "}
              {item.avery && (
                <span className="ml-1 align-middle" title="Avery Recommended">
                  <IconStar />
                  <span className="sr-only">Avery Recommended</span>
                </span>
              )}
            </h3>
            {item.price && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-medium text-neutral-800">
                {item.price}
              </span>
            )}
            {item.tags?.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#E3E0D1] px-2 py-0.5 text-[11px] font-medium text-neutral-800"
              >
                {t}
              </span>
            ))}
          </div>
          {item.desc && <p className="mt-1.5 text-sm text-neutral-800">{item.desc}</p>}
          {item.note && <p className="mt-1 text-xs text-neutral-600 italic">{item.note}</p>}
        </div>
      </div>
    </a>
  );
}

/* --------------------------------- Data ---------------------------------- */
/* All items now click to Google Maps (override city with mapsQuery if needed). */

const restaurants: RecItem[] = [
  { name: "Dirty Frank's Hot Dog Palace", price: "$", tags: ["Casual", "Downtown"], avery: true, mapsQuery: "Dirty Frank’s Hot Dog Palace, Columbus, OH" },
  { name: "Yabo’s Tacos", price: "$", tags: ["Tacos", "Casual"], avery: true, mapsQuery: "Yabo's Tacos Polaris, Columbus, OH" },
  { name: "North Market", price: "$$", desc: "Classic Columbus food hall with lots of stalls.", tags: ["Food hall", "Downtown"], mapsQuery: "North Market Downtown, Columbus, OH" },
];

const drinks: RecItem[] = [
  { name: "Village Coffee of Sunbury", price: "$", tags: ["Coffee"], avery: true, mapsQuery: "Village Coffee of Sunbury, Sunbury, OH" },
  { name: "Ravello's Coffee", price: "$", tags: ["Coffee"], avery: true, mapsQuery: "Ravello Coffee, Westerville, OH" },
];

const activities: RecItem[] = [
  { name: "Groovy Plant Ranch", desc: "Huge, fun plant nursery & greenhouse.", tags: ["Plants", "Photo-friendly"], avery: true, mapsQuery: "Groovy Plant Ranch, Marengo, OH" },
  { name: "Columbus Museum of Art", tags: ["Museum", "Indoor"], mapsQuery: "Columbus Museum of Art, Columbus, OH" },
  { name: "Franklin Park Conservatory & Botanical Gardens", tags: ["Garden", "Indoor/Outdoor"], mapsQuery: "Franklin Park Conservatory, Columbus, OH" },
  { name: "German Village", desc: "Brick streets, bookshops, and cozy eats.", tags: ["Neighborhood", "Stroll"], mapsQuery: "German Village, Columbus, OH" },
  { name: "Short North Arts District", desc: "Boutiques, galleries, and dining.", tags: ["Neighborhood", "Shops"], mapsQuery: "Short North Arts District, Columbus, OH" },
  { name: "Easton Town Center (Mall)", tags: ["Shopping", "Dining"], mapsQuery: "Easton Town Center, Columbus, OH" },
  { name: "Polaris Fashion Place (Mall)", tags: ["Shopping"], mapsQuery: "Polaris Fashion Place, Columbus, OH" },
];
