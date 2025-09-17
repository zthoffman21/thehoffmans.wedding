import { useId } from "react";

export function Tape({ className = "" }: { className?: string }) {
    const uid = useId().replace(/:/g, "-");
    const id = (n: string) => `${n}-${uid}`;

    const isIOS =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1));

    return (
        <svg
            className={`absolute ${className}`}
            viewBox="0 0 320 80"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            preserveAspectRatio="none"
        >
            <defs>
                {/* Slightly warm so it reads on a cream card */}
                <linearGradient id={id("tapeShade")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.90)" />
                </linearGradient>

                <pattern
                    id={id("tapeStripes")}
                    width="12"
                    height="80"
                    patternUnits="userSpaceOnUse"
                >
                    <rect width="6" height="80" fill="rgba(0,0,0,0.08)" />
                    <rect x="6" width="6" height="80" fill="rgba(0,0,0,0.05)" />
                </pattern>

                <filter id={id("tapeShadow")} x="-20%" y="-40%" width="140%" height="200%">
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

            <g
                className={`${isIOS ? "" : "mix-blend-multiply sm:mix-blend-normal"}`}
                filter={`url(#${id("tapeShadow")})`}
            >
                <path
                    d="M 0 0 L 16 0 L 12 8 L 16 16 L 12 24 L 16 32 L 12 40 L 16 48 L 12 56 L 16 64 L 12 72 L 16 80 L 304 80 L 308 72 L 304 64 L 308 56 L 304 48 L 308 40 L 304 32 L 308 24 L 304 16 L 308 8 L 304 0 Z"
                    fill={`url(#${id("tapeShade")})`}
                    stroke="rgba(0,0,0,0.10)"
                    strokeWidth="1"
                />
                <path
                    d="M 0 0 L 16 0 L 12 8 L 16 16 L 12 24 L 16 32 L 12 40 L 16 48 L 12 56 L 16 64 L 12 72 L 16 80 L 304 80 L 308 72 L 304 64 L 308 56 L 304 48 L 308 40 L 304 32 L 308 24 L 304 16 L 308 8 L 304 0 Z"
                    fill={`url(#${id("tapeStripes")})`}
                    opacity="0.75"
                />
            </g>
        </svg>
    );
}