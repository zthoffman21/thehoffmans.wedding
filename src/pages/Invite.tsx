import { useParams } from "react-router-dom";
import PerforatedButton from "../components/PerforatedButton";
import { useId } from "react";
import { Tape } from "../components/Tape";

export default function Invite() {
    const { code } = useParams();

    return (
        <section className="relative min-h-[100dvh]">
            {/* Background photo */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/invite-bg.jpg?v=3')" }}
                aria-hidden="true"
            />
            {/* Vignette for legibility */}
            <div
                className="absolute inset-0 z-10"
                aria-hidden="true"
                style={{
                    background:
                        "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.22), transparent), linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.32))",
                }}
            />

            {/* Content */}
            <div className="relative z-20 min-h-[100dvh] container-px py-8 sm:py-14 grid place-items-center">
                <div className="w-full max-w-4xl">
                    <Postcard code={code} />
                </div>
            </div>
        </section>
    );
}

function Postcard({ code }: { code?: string }) {
    return (
        <div className="relative">
            {/* Glow */}
            <div
                className="pointer-events-none absolute inset-0 -z-10 translate-y-2 blur-lg opacity-45 rounded-[18px] bg-black/35"
                aria-hidden="true"
            />

            {/* ===== Mobile scale wrapper (scales whole postcard on xs) ===== */}
            <div
                className="block relative [container-type:inline-size]"
                style={
                    {
                        // Base design size for the interior card (approx 7:5 including bottom bar)
                        "--designW": "720px",
                        "--designH": "514px",
                        // Scale down when container is narrower than the design width; cap at 1
                        "--s": "min(1, calc(100cqw / var(--designW)))",
                        // Reserve the scaled height so layout is stable on mobile
                        height: "calc(var(--designH) * var(--s))",
                    } as React.CSSProperties
                }
            >
                {/* Absolutely position and scale the desktop composition */}
                <div
                    className="absolute left-1/2 top-0 -translate-x-1/2"
                    style={{
                        width: "var(--designW)",
                        height: "var(--designH)",
                        transform: "scale(var(--s))",
                        transformOrigin: "top center",
                    }}
                >
                    {/* MOBILE: tape that scales with the postcard */}
                    <div className="lg:hidden pointer-events-none absolute z-[9999] left-15/40 -translate-x-1/2 -top-8">
                        <Tape className="w-[200px] h-auto z-[9999]" />
                    </div>

                    {/* === Card interior (desktop composition used everywhere, then scaled on mobile) === */}
                    <div
                        className="
              relative
              rounded-[16px] border border-neutral-300 bg-[#FAF7EC] shadow-xl overflow-hidden
            "
                        style={{
                            width: "var(--designW)",
                            height: "var(--designH)",
                            backgroundImage:
                                "radial-gradient(1px 1px at 22% 28%, rgba(0,0,0,.09) 1px, transparent 1px)," +
                                "radial-gradient(1px 1px at 72% 62%, rgba(0,0,0,.07) 1px, transparent 1px)," +
                                "linear-gradient(0deg, rgba(255,255,255,.55), rgba(255,255,255,.55))",
                            backgroundSize: "20px 20px, 22px 22px, auto",
                        }}
                    >
                        {/* Printed border */}
                        <div className="absolute inset-2.5 rounded-[12px] border border-neutral-300/90 pointer-events-none" />

                        {/* Divider (always on; was desktop-only) */}
                        <div className="absolute top-3 bottom-36 left-[55%] -translate-x-1/2 border-l border-neutral-300/90" />

                        {/* LEFT cursive section (absolute, centered within its own area) */}
                        <div className="grid absolute top-5 bottom-36 left-5 right-[48%] pr-4 place-content-center justify-items-center text-center">
                            <h1
                                className="text-ink tracking-wide text-[46px] leading-tight"
                                style={{ fontFamily: '"Dancing Script", cursive' }}
                            >
                                Welcome!
                            </h1>
                            <p
                                className="mt-3 text-ink/90 text-[30px] leading-snug"
                                style={{ fontFamily: '"Dancing Script", cursive' }}
                            >
                                We invite you to celebrate with us
                                {code ? (
                                    <>
                                        {" "}
                                        — code <span className="font-mono not-italic">{code}</span>
                                    </>
                                ) : null}
                                .
                            </p>
                        </div>

                        {/* RIGHT address panel + stamp cluster */}
                        <div className="grid absolute left-[55%] right-5 top-5 bottom-20 pl-5">
                            <div className="relative self-center justify-self-start w-full">
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-x-0 -top-2 h-24 opacity-[0.2]"
                                    style={{
                                        backgroundImage:
                                            "repeating-linear-gradient(transparent, transparent 22px, rgba(60,56,54,0.5) 23px)",
                                    }}
                                />
                                <div className="relative text-left left-2">
                                    <div className="text-ink/70 text-xs">To:</div>
                                    <div className="text-ink font-medium text-[15px] leading-tight">
                                        Dear Guest
                                    </div>
                                    <div className="text-ink/70 text-xs mt-2">From:</div>
                                    <div className="text-ink text-[15px]">Avery &amp; Zach</div>
                                </div>
                            </div>

                            {/* Stamp + postmark (absolute cluster at top-right of the right panel) */}
                            <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                                {/* Use fixed design sizes so they scale uniformly with the card */}
                                <div className="relative">
                                    <Stamp className="w-[100px] h-auto drop-shadow-sm -rotate-1" />
                                    <Postmark className="w-[80px] h-auto absolute -right-6 -top-0 opacity-60 mix-blend-multiply pointer-events-none rotate-6" />
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM CTA */}
                        <div className="absolute inset-x-0 bottom-0 h-36 border-t border-neutral-300/70 px-4 grid place-items-center">
                            <div className="relative flex flex-col items-center text-center gap-2">
                                <span className="text-ink/70 text-[15px] max-w-[40ch] px-2">
                                    Tap below for details about the day, RSVP, and travel tips.
                                </span>

                                <PerforatedButton to="/" variant="postcard">
                                    View Details
                                </PerforatedButton>

                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-x-4 -bottom-1 h-[2px] opacity-25"
                                />
                            </div>
                        </div>
                    </div>
                    {/* === /Card interior === */}
                </div>
            </div>

            {/* DESKTOP/TABLET: original two tapes */}
            <div className="hidden lg:block z-[500]">
                <Tape className="left-6 -top-7 -rotate-12 h-16 w-48" />
                <Tape className="right-8 -top-8 rotate-10 h-16 w-48" />
            </div>
        </div>
    );
}

function Stamp({ className = "" }: { className?: string }) {
    const uid = useId().replace(/:/g, "-");
    const id = (name: string) => `${name}-${uid}`;

    const W = 100,
        H = 128,
        r = 5,
        step = 10;

    const top = Array.from({ length: Math.floor((W - step) / step) + 1 }, (_, i) => ({
        cx: step / 2 + i * step,
        cy: 0,
    }));
    const bottom = top.map(({ cx }) => ({ cx, cy: H }));
    const left = Array.from({ length: Math.floor((H - step) / step) + 1 }, (_, i) => ({
        cx: 0,
        cy: step / 2 + i * step,
    }));
    const right = left.map(({ cy }) => ({ cx: W, cy }));

    return (
        <svg
            className={className}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            shapeRendering="geometricPrecision"
        >
            <defs>
                <linearGradient id={id("paperTint")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.86)" />
                </linearGradient>
                <linearGradient id={id("roseGrad")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA6962" />
                    <stop offset="100%" stopColor="#D85A54" />
                </linearGradient>
                <linearGradient id={id("leafGrad")} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A7C080" />
                    <stop offset="100%" stopColor="#7FA466" />
                </linearGradient>
                <radialGradient id={id("petalHighlight")} cx="50%" cy="20%" r="70%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>

                <mask
                    id={id("scallopMask")}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width={W}
                    height={H}
                >
                    <rect x="0" y="0" width={W} height={H} fill="white" />
                    <g fill="black">
                        {top.map((p, i) => (
                            <circle key={`t${i}`} cx={p.cx} cy={p.cy} r={r} />
                        ))}
                        {bottom.map((p, i) => (
                            <circle key={`b${i}`} cx={p.cx} cy={p.cy} r={r} />
                        ))}
                        {left.map((p, i) => (
                            <circle key={`l${i}`} cx={p.cx} cy={p.cy} r={r} />
                        ))}
                        {right.map((p, i) => (
                            <circle key={`r${i}`} cx={p.cx} cy={p.cy} r={r} />
                        ))}
                    </g>
                </mask>

                <filter
                    id={id("softShadow")}
                    x={-W}
                    y={-H}
                    width={W * 3}
                    height={H * 3}
                    filterUnits="userSpaceOnUse"
                >
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
                    <feOffset dx="0" dy="1" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.45" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g mask={`url(#${id("scallopMask")})`} filter={`url(#${id("softShadow")})`}>
                <rect
                    x="0.5"
                    y="0.5"
                    width={W - 1}
                    height={H - 1}
                    fill={`url(#${id("paperTint")})`}
                    stroke="#c8c8c8"
                />
                <rect
                    x="4"
                    y="4"
                    width={W - 8}
                    height={H - 8}
                    fill="none"
                    stroke="rgba(0,0,0,0.22)"
                />

                {/* Tulip */}
                <g transform={`translate(${W / 2}, ${H / 2 + 4})`}>
                    <rect
                        x="-1.1"
                        y="-6"
                        width="2.2"
                        height="18"
                        rx="1.1"
                        fill={`url(#${id("leafGrad")})`}
                    />
                    <path
                        d="M -1 6 C -7 3, -12 5, -14 9 C -8 8, -3 10, -1 12 Z"
                        fill={`url(#${id("leafGrad")})`}
                        opacity="0.95"
                    />
                    <path
                        d="M 1 6 C 7 3, 12 5, 14 9 C 8 8, 3 10, 1 12 Z"
                        fill={`url(#${id("leafGrad")})`}
                        opacity="0.95"
                    />
                    <g opacity="0.85">
                        <path
                            d="M -10 -15 C -10 -22, -2 -24, 0 -18 C 2 -24, 10 -22, 10 -15 C 10 -10, 6 -6, 0 -6 C -6 -6, -10 -10, -10 -15 Z"
                            fill={`url(#${id("roseGrad")})`}
                        />
                    </g>
                    <path
                        d="M 0 -24 C 6 -24, 10 -20, 10 -14 C 10 -8, 6 -4, 0 -4 C -6 -4, -10 -8, -10 -14 C -10 -20, -6 -24, 0 -24 Z"
                        fill={`url(#${id("roseGrad")})`}
                    />
                    <path
                        d="M -10 -16 C -14 -18, -14 -10, -10 -8 C -6 -6, -4 -6, -2 -8 C -2 -12, -6 -16, -10 -16 Z"
                        fill="#D85A54"
                        opacity="0.95"
                    />
                    <path
                        d="M 10 -16 C 14 -18, 14 -10, 10 -8 C 6 -6, 4 -6, 2 -8 C 2 -12, 6 -16, 10 -16 Z"
                        fill="#D85A54"
                        opacity="0.95"
                    />
                    <ellipse
                        cx="-3"
                        cy="-18"
                        rx="7"
                        ry="5"
                        fill={`url(#${id("petalHighlight")})`}
                        opacity="0.45"
                    />
                </g>

                <text
                    x={W / 2}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="rgba(60,56,54,0.70)"
                >
                    A & Z • 2026
                </text>
            </g>
        </svg>
    );
}

function Postmark({ className = "" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 80 48"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="28" cy="20" r="12" stroke="rgba(60,56,54,.6)" strokeWidth="2" />
            <circle cx="28" cy="20" r="16" stroke="rgba(60,56,54,.4)" strokeWidth="1.5" />
            <path
                d="M40 8 C55 5, 65 11, 78 8 M40 16 C55 13, 65 19, 78 16 M40 24 C55 21, 65 27, 78 24"
                stroke="rgba(60,56,54,.5)"
                strokeWidth="2"
                fill="none"
            />
        </svg>
    );
}
