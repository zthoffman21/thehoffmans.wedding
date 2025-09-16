import { Link } from 'react-router-dom'

export default function PerforatedButton({
  children,
  to,
  variant = 'paper', // 'paper' | 'sage' | 'terracotta' | 'ink'
  className = '',
}: {
  children: React.ReactNode
  to: string
  variant?: 'paper' | 'sage' | 'terracotta' | 'ink'
  className?: string
}) {
  const tooth = 9
  const palette = {
    paper:      { bg: '#FAF7EC', text: '#3C3836', border: 'rgba(0,0,0,0.22)', inner1: 'rgba(0,0,0,0.14)', inner2: 'rgba(0,0,0,0.10)', arrow: '#D79921' },
    sage:       { bg: '#EAF0E2', text: '#2F332F', border: 'rgba(56,68,52,0.22)', inner1: 'rgba(56,68,52,0.14)', inner2: 'rgba(56,68,52,0.10)', arrow: '#7FA466' },
    terracotta: { bg: '#F3E3DE', text: '#3B2E2B', border: 'rgba(66,38,33,0.24)', inner1: 'rgba(66,38,33,0.14)', inner2: 'rgba(66,38,33,0.10)', arrow: '#C05C4F' },
    ink:        { bg: '#F1EEE7', text: '#2F2B29', border: 'rgba(0,0,0,0.28)', inner1: 'rgba(0,0,0,0.16)', inner2: 'rgba(0,0,0,0.10)', arrow: '#6B625E' },
  }[variant]

  return (
    <Link
      to={to}
      className={
        "group relative inline-flex items-center justify-center " +
        "h-11 px-5 sm:px-6 text-[15px] font-medium transition " +
        "focus:outline-none focus:ring-2 focus:ring-accent/25 " + className
      }
      style={{
        background: palette.bg,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.65)',
        WebkitMaskImage: [
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) top / 100% ${tooth * 2}px repeat-x`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) bottom / 100% ${tooth * 2}px repeat-x`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) left / ${tooth * 2}px 100% repeat-y`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) right / ${tooth * 2}px 100% repeat-y`,
          `linear-gradient(black, black)`,
        ].join(','),
        maskImage: [
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) top / 100% ${tooth * 2}px repeat-x`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) bottom / 100% ${tooth * 2}px repeat-x`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) left / ${tooth * 2}px 100% repeat-y`,
          `radial-gradient(circle, transparent ${tooth - 1}px, black ${tooth}px) right / ${tooth * 2}px 100% repeat-y`,
          `linear-gradient(black, black)`,
        ].join(','),
      }}
    >
      {/* double printed inner frame */}
      <span aria-hidden className="pointer-events-none absolute inset-1 rounded-[2px]" style={{ border: `1px solid ${palette.inner1}` }} />
      <span aria-hidden className="pointer-events-none absolute inset-[6px] rounded-[2px]" style={{ border: `1px solid ${palette.inner2}` }} />
      <span className="relative">{children}</span>
      <svg className="relative ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
           viewBox="0 0 24 24" fill="none" stroke={palette.arrow} strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
