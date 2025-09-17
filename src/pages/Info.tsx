import React from "react";
import PerforatedButton from "../components/PerforatedButton";
import { Link } from "react-router-dom";

const Icon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current">
    <path d={path} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCalendar = () => (
  <Icon path="M8 2v3m8-3v3M3 9h18M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm3 6h8" />
);
const IconCake = () => (
  <Icon path="M12 3v4m6 5H6m12 0v6H6v-6m12 0a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3" />
);
const IconUsers = () => (
  <Icon path="M16 11a4 4 0 1 0-8 0m12 6a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4" />
);
const IconMapPin = () => (
  <Icon path="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
);
const IconShirt = () => (
  <Icon path="M16 4 12 6 8 4 5 6v14h14V6l-3-2z" />
);
const IconLink = () => (
    <Icon path="M14 3h7v7M21 3l-9 9M5 5h6v2H7v10h10v-4h2v6H5z" />
);

export default function InfoPage() {
  return (
    <section className="relative bg-[#F2EFE7] min-h-screen overflow-x-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
        style={{ backgroundImage: "url('/info-bg.jpg?v=3')" }}
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

      {/* Page content */}
      <div className="relative z-20">
        <header className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 text-center text-[#F2EFE7]">
          <p className="text-sm/6 tracking-widest uppercase opacity-90">Aspen & Alston</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">What to Expect</h1>
          <p className="mt-4 max-w-2xl text-base/7 opacity-95">
            A relaxed celebration with our closest friends and family — good food, easy vibes, and great memories.
          </p>
        </header>

        {/* Main grid */}
        <main className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 px-4 pb-24 sm:mt-14 md:grid-cols-5">
          {/* LEFT column */}
          <div className="md:col-span-3 space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader icon={<IconCalendar />} title="Timeline of the Day" subtitle="All at Aspen & Alston" />
              <div className="mt-4 space-y-3">
                {timeline.map((t) => (
                  <TimelineRow key={t.time} time={t.time} label={t.label} />
                ))}
              </div>
            </Card>

            {/* Attire */}
            <Card>
              <CardHeader icon={<IconShirt />} title="What to Wear" subtitle="Dressy casual — examples below" />
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <AttireCard title="For Men" items={["Chinos or dress pants", "Button-down or nice polo", "Optional jacket"]} />
                <AttireCard title="For Women" items={["Short or midi dresses", "Light colors or florals", "Comfortable heels/flats"]} />
                <AttireCard title="General Tips" items={["Wear something that makes you feel good", "The ceremony is outdoors so be prepared"]} />
              </div>
            </Card>
          </div>

          {/* RIGHT column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader icon={<IconUsers />} title="The Vibe" />
              <p className="mt-3 text-neutral-800">
                A chill wedding focused on time together with close friends and family. Come ready to relax, celebrate, and
                make memories with us.
              </p>
            </Card>

            <Card>
              <CardHeader icon={<IconCake />} title="Food & Drinks" />
              <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800">
                <li>Cocktail hour begins at <strong>6:00 PM</strong>.</li>
                <li>Dinner begins at <strong>7:30 PM</strong>.</li>
                <li>Cake cutting around <strong>8:30 PM</strong>.</li>
              </ul>
            </Card>

            <Card>
              <CardHeader icon={<IconMapPin />} title="Venue & Notes" />
              <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800">
                <li>All events are at <strong>Aspen & Alston</strong>.</li>
                <li>On-site parking available.</li>
                <li>Please plan for an adults-focused evening.</li>
                <li>Couple's exit at <strong>10:00 PM</strong>; venue closes at <strong>11:00 PM</strong>.</li>
              </ul>
            </Card>

            <Card>
              <CardHeader icon={<IconLink />} title="Quick Links" />
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="https://www.aspenandalston.com/">
                  <PerforatedButton to={"https://www.aspenandalston.com/"} arrowColor="#A7C080">
                    <span>The Venue</span>
                  </PerforatedButton>
                </Link>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </section>
  );
}

/* ------------------------------ Subcomponents ------------------------------ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#F7F4EC]/95 shadow-[0_6px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur-sm">
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

function TimelineRow({ time, label }: { time: string; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-[#F2EFE7] shadow-sm">{time}</div>
      <div className="pt-0.5 text-sm text-neutral-900">{label}</div>
    </div>
  );
}

function AttireCard({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-xl border border-black/5 bg-white/80 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-800">
                {items.filter((t) => typeof t === 'string' && t.trim().length > 0).map((text, idx) => (
                <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-700" />
                    <span>{text}</span>
                </li>
                ))}
            </ul>
        </div>
    );
}

/* --------------------------------- Data ---------------------------------- */

const timeline = [
  { time: "5:00 PM", label: "Guests arrive" },
  { time: "5:30 PM", label: "Ceremony begins" },
  { time: "6:00 PM", label: "Cocktail hour" },
  { time: "7:00 PM", label: "Guests enter reception" },
  { time: "7:30 PM", label: "Dinner begins" },
  { time: "8:30 PM", label: "Cake cutting" },
  { time: "8:45 PM", label: "Speeches & toasts" },
  { time: "9:00 PM", label: "First dance + parent dances" },
  { time: "9:15 PM", label: "Dancing & celebration" },
  { time: "10:00 PM", label: "Couple's exit" },
  { time: "11:00 PM", label: "Venue closes" },
];