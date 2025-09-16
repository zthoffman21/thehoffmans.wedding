// src/components/TapeZigzag.tsx
export default function TapeZigzag({
  className = '',
  opacity = 0.9, // 0..1
}: {
  className?: string
  opacity?: number
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 320 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="tapeShade" x1="0" y1="0" x2="0" y2="1">
          {/* slightly denser by default; overall opacity still controlled below */}
          <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.90)" />
        </linearGradient>

        <pattern id="tapeStripes" width="12" height="80" patternUnits="userSpaceOnUse">
          <rect width="6" height="80" fill="rgba(0,0,0,0.08)" />
          <rect x="6" width="6" height="80" fill="rgba(0,0,0,0.05)" />
        </pattern>

        <filter id="tapeShadow" x="-20%" y="-40%" width="140%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* overall tape opacity is controlled here */}
      <g filter="url(#tapeShadow)" style={{ mixBlendMode: 'multiply', opacity }}>
        {/* optional warm base tint beneath gradients/stripes */}
        {/* <rect x="0" y="0" width="320" height="80" fill="#fffdf6" /> */}

        {/* zig-zag ends on the short sides */}
        <path
          d="
            M0 0 L16 0 L12 8 16 16 12 24 16 32 12 40 16 48 12 56 16 64 12 72 16 80 L304 80
            L308 72 304 64 308 56 304 48 308 40 304 32 308 24 304 16 308 8 L304 0 Z
          "
          fill="url(#tapeShade)"
          stroke="rgba(0,0,0,0.10)"
          strokeWidth="1"
        />
        <path
          d="
            M0 0 L16 0 L12 8 16 16 12 24 16 32 12 40 16 48 12 56 16 64 12 72 16 80 L304 80
            L308 72 304 64 308 56 304 48 308 40 304 32 308 24 304 16 308 8 L304 0 Z
          "
          fill="url(#tapeStripes)"
          opacity="0.95"
        />
      </g>
    </svg>
  )
}
