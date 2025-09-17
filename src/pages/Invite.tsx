import { useParams } from "react-router-dom";
import PerforatedButton from "../components/PerforatedButton";

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
      <div className="relative z-20 min-h-[100dvh] container-px py-10 sm:py-14 grid place-items-center">
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
      <div
        className="pointer-events-none absolute inset-0 -z-10 translate-y-2 blur-lg opacity-45 rounded-[18px] bg-black/35"
        aria-hidden="true"
      />

      <div
        className="
          relative mx-auto aspect-[7/5] w-full max-w-3xl
          rounded-[16px] border border-neutral-300 bg-[#FAF7EC] shadow-xl overflow-hidden
        "
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 22% 28%, rgba(0,0,0,.05) 1px, transparent 1px)," +
            "radial-gradient(1px 1px at 72% 62%, rgba(0,0,0,.05) 1px, transparent 1px)," +
            "linear-gradient(0deg, rgba(255,255,255,.55), rgba(255,255,255,.55))",
          backgroundSize: "20px 20px, 22px 22px, auto",
        }}
      >
        {/* Printed border */}
        <div className="absolute inset-2.5 rounded-[12px] border border-neutral-300/70 pointer-events-none" />

        {/* Divider stops above bottom bar */}
        <div className="absolute top-8 bottom-28 sm:bottom-36 left-[55%] -translate-x-1/2 border-l border-neutral-300/70" />

        {/* LEFT: centered cursive */}
        <div className="absolute inset-y-5 left-5 right-[48%] pr-4 grid place-content-center justify-items-center text-center">
          <h1
            className="text-ink tracking-wide text-[clamp(28px,4.4vw,46px)] leading-tight"
            style={{ fontFamily: '"Dancing Script", cursive' }}
          >
            Welcome!
          </h1>

          <p
            className="mt-3 text-ink/90 text-[clamp(20px,3.2vw,30px)] leading-snug"
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

        {/* RIGHT panel */}
        <div className="absolute left-[55%] right-5 top-5 bottom-24 sm:bottom-20 pl-5 grid">
          <div className="relative self-center justify-self-start w-full">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-2 h-24 opacity-[0.14]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 22px, rgba(60,56,54,0.5) 23px)",
              }}
            />
            <div className="relative text-left">
              <div className="text-ink/70 text-xs">To:</div>
              <div className="text-ink font-medium text-[15px] leading-tight">
                Dear Guest
              </div>
              <div className="text-ink/70 text-xs mt-2">From:</div>
              <div className="text-ink text-[15px]">Avery &amp; Zach</div>
            </div>
          </div>

          <div className="absolute top-0 right-0">
            <Stamp />
            <Postmark />
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="absolute inset-x-0 bottom-0 h-24 sm:h-36 border-t border-neutral-300/70 px-4 grid place-items-center">
          <div className="relative flex flex-col items-center text-center gap-2">
            <span className="text-ink/70 text-sm sm:text-[15px] max-w-[40ch]">
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
      <Tape className="left-6 -top-7 -rotate-6 h-16 w-48" />
      <Tape className="right-4 -top-8 rotate-6 h-16 w-48" />
    </div>
  );
}

function Stamp() {
  const W = 100;
  const H = 128;
  const r = 5;
  const step = 10;

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

  const rose = "#EA6962";
  const roseDark = "#D85A54";
  const sage = "#A7C080";
  const sageDark = "#7FA466";
  const ink = "rgba(60,56,54,0.70)";

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="drop-shadow-sm"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="paperTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.86)" />
        </linearGradient>
        <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rose} />
          <stop offset="100%" stopColor={roseDark} />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={sage} />
          <stop offset="100%" stopColor={sageDark} />
        </linearGradient>
        <radialGradient id="petalHighlight" cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <mask id="scallopMask">
          <rect x="0" y="0" width={W} height={H} fill="white" />
          <g fill="black">
            {top.map((p, i) => <circle key={`t${i}`} cx={p.cx} cy={p.cy} r={r} />)}
            {bottom.map((p, i) => <circle key={`b${i}`} cx={p.cx} cy={p.cy} r={r} />)}
            {left.map((p, i) => <circle key={`l${i}`} cx={p.cx} cy={p.cy} r={r} />)}
            {right.map((p, i) => <circle key={`r${i}`} cx={p.cx} cy={p.cy} r={r} />)}
          </g>
        </mask>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
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

      <g mask="url(#scallopMask)" filter="url(#softShadow)">
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="url(#paperTint)" stroke="#c8c8c8" />
        <rect x="4" y="4" width={W - 8} height={H - 8} fill="none" stroke="rgba(0,0,0,0.22)" />

        {/* Tulip */}
        <g transform={`translate(${W / 2}, ${H / 2 + 4})`}>
          <rect x="-1.1" y="-6" width="2.2" height="18" rx="1.1" fill="url(#leafGrad)" />
          <path d="M -1 6 C -7 3, -12 5, -14 9 C -8 8, -3 10, -1 12 Z" fill="url(#leafGrad)" opacity="0.95" />
          <path d="M 1 6 C 7 3, 12 5, 14 9 C 8 8, 3 10, 1 12 Z" fill="url(#leafGrad)" opacity="0.95" />
          <g opacity="0.85">
            <path d="M -10 -15 C -10 -22, -2 -24, 0 -18 C 2 -24, 10 -22, 10 -15 C 10 -10, 6 -6, 0 -6 C -6 -6, -10 -10, -10 -15 Z" fill="url(#roseGrad)" />
          </g>
          <path d="M 0 -24 C 6 -24, 10 -20, 10 -14 C 10 -8, 6 -4, 0 -4 C -6 -4, -10 -8, -10 -14 C -10 -20, -6 -24, 0 -24 Z" fill="url(#roseGrad)" />
          <path d="M -10 -16 C -14 -18, -14 -10, -10 -8 C -6 -6, -4 -6, -2 -8 C -2 -12, -6 -16, -10 -16 Z" fill="#D85A54" opacity="0.95" />
          <path d="M 10 -16 C 14 -18, 14 -10, 10 -8 C 6 -6, 4 -6, 2 -8 C 2 -12, 6 -16, 10 -16 Z" fill="#D85A54" opacity="0.95" />
          <ellipse cx="-3" cy="-18" rx="7" ry="5" fill="url(#petalHighlight)" opacity="0.45" />
          <path d="M 0 -22 C 0 -18, 0 -12, 0 -8" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
          <path d="M -6 -14 C -4 -12, -3 -10, -2 -8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
          <path d="M 6 -14 C 4 -12, 3 -10, 2 -8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        </g>

        <text
          x={W / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="10.5"
          fill={ink}
          style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}
        >
          A & Z • 2026
        </text>
      </g>
    </svg>
  );
}

function Tape({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute ${className}`}
      viewBox="0 0 320 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="tapeShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.88)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.72)" />
        </linearGradient>
        <pattern id="tapeStripes" width="12" height="80" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="6" height="80" fill="rgba(0,0,0,0.06)" />
          <rect x="6" y="0" width="6" height="80" fill="rgba(0,0,0,0.03)" />
        </pattern>
        <filter id="tapeShadow" x="-20%" y="-40%" width="140%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#tapeShadow)" style={{ mixBlendMode: "multiply" }}>
        <path d="M 0 0 L 16 0 L 12 8 L 16 16 L 12 24 L 16 32 L 12 40 L 16 48 L 12 56 L 16 64 L 12 72 L 16 80 L 304 80 L 308 72 L 304 64 L 308 56 L 304 48 L 308 40 L 304 32 L 308 24 L 304 16 L 308 8 L 304 0 Z"
              fill="url(#tapeShade)" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
        <path d="M 0 0 L 16 0 L 12 8 L 16 16 L 12 24 L 16 32 L 12 40 L 16 48 L 12 56 L 16 64 L 12 72 L 16 80 L 304 80 L 308 72 L 304 64 L 308 56 L 304 48 L 308 40 L 304 32 L 308 24 L 304 16 L 308 8 L 304 0 Z"
              fill="url(#tapeStripes)" opacity="0.75" />
      </g>
    </svg>
  );
}

function Postmark() {
  return (
    <svg
      className="absolute -right-6 -top-3 opacity-50"
      width="80"
      height="48"
      viewBox="0 0 80 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="28" cy="20" r="12" stroke="rgba(60,56,54,.6)" strokeWidth="2" />
      <circle cx="28" cy="20" r="16" stroke="rgba(60,56,54,.4)" strokeWidth="1.5" />
      <path d="M40 8 C55 5, 65 11, 78 8 M40 16 C55 13, 65 19, 78 16 M40 24 C55 21, 65 27, 78 24"
            stroke="rgba(60,56,54,.5)" strokeWidth="2" fill="none" />
    </svg>
  );
}
