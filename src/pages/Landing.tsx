import PerforatedButton from "../components/PerforatedButton";
import TapeZigzag from "../components/TapZigzag";

export default function Landing() {
    return (
        <section className="relative bg-[#F2EFE7]">
            {/* Hero with photo + vignette */}
            <div className="relative isolate">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
                    style={{ backgroundImage: "url('/landing-bg.jpg?v=3')" }}
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


                <div className="container-px min-h-[70dvh] sm:min-h-[76dvh] grid place-items-center pt-16 pb-16 sm:pt-24 sm:pb-24">
                    <div className="text-center max-w-3xl">
                        <h1
                            className="text-white drop-shadow text-[clamp(40px,7vw,84px)] leading-[0.95]"
                            style={{ fontFamily: '"Dancing Script", cursive' }}
                        >
                            Avery &amp; Zach
                        </h1>
                        <p className="mt-3 text-[clamp(16px,2.2vw,20px)] text-white/85">
                            June 2026 • Ohio
                        </p>

                        <div className="mt-8 flex items-center justify-center gap-3">
                            <PerforatedButton to="/rsvp" variant="paper">
                                RSVP
                            </PerforatedButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Paper cards with centered tapes */}
            <div className="container-px -mt-10 sm:-mt-14 pb-20 grid gap-6 sm:grid-cols-3">
                <PaperCard
                    title="What to Expect"
                    subtitle="Flow of the day • Dress code"
                    accent="accent"
                    to="/info#expect"
                    cta="Read details"
                    tapeClass="left-1/2 -translate-x-1/2 -top-4 rotate-[-4deg] w-32 h-8"
                >
                    Ceremony timing, reception vibe, and little things that’ll make the day feel
                    easy.
                </PaperCard>

                <PaperCard
                    title="Travel & Stay"
                    subtitle="Nearby hotels & tips"
                    accent="sage"
                    to="/info#travel"
                    cta="Plan your trip"
                    tapeClass="left-1/2 -translate-x-1/2 -top-5 rotate-[3deg] w-36 h-8"
                >
                    Hotel blocks, local spots we love, parking notes, and airport info.
                </PaperCard>

                <PaperCard
                    title="Photo Gallery"
                    subtitle="Snapshots & memories"
                    accent="rose"
                    to="/gallery"
                    cta="View photos"
                    tapeClass="left-1/2 -translate-x-1/2 -top-6 rotate-[1deg] w-28 h-8"
                >
                    A look at our favorite moments and guest candids—add yours, too!
                </PaperCard>
            </div>
        </section>
    );
}

/* ---- Reusable paper card (invite-matched) ---- */
function PaperCard({
    title,
    subtitle,
    accent = "accent",
    to = "/info",
    cta = "Learn more",
    tapeClass = "",
    children,
}: {
    title: string;
    subtitle?: string;
    accent?: "accent" | "rose" | "sage";
    to?: string;
    cta?: string;
    tapeClass?: string;
    children: React.ReactNode;
}) {
    const dot = { accent: "#D79921", rose: "#EA6962", sage: "#A7C080" }[accent];

    return (
        <div className="relative rounded-[16px] border border-neutral-300 bg-[#FAF7EC] shadow-xl overflow-hidden">

            {/* printed border inset */}
            <div className="absolute inset-2 rounded-[12px] border border-neutral-300/70 pointer-events-none" />

            {/* paper speckle */}
            <div
                aria-hidden
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage:
                        "radial-gradient(1px 1px at 22% 28%, rgba(0,0,0,.5) 1px, transparent 1px)," +
                        "radial-gradient(1px 1px at 72% 62%, rgba(0,0,0,.5) 1px, transparent 1px)",
                    backgroundSize: "20px 20px, 22px 22px",
                }}
            />

            <div className="p-6">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
                    <h3 className="font-serif text-[20px] text-ink">{title}</h3>
                </div>
                {subtitle && <p className="mt-1 text-ink/70 text-sm">{subtitle}</p>}
                <p className="mt-3 text-ink/85">{children}</p>

                <div className="mt-5">
                    <PerforatedButton to={to} variant="paper" className="h-10 px-4 text-[14px]">
                        {cta}
                    </PerforatedButton>
                </div>
            </div>
                        {/* centered tape (unique offsets/angles per card via props) */}
            <div className={`absolute ${tapeClass}`}>
                <TapeZigzag className="h-full w-full" opacity={1} />
            </div>
        </div>
    );
}
