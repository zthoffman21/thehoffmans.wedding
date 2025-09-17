import React from 'react'
import { Link } from 'react-router-dom'

type PerforatedButtonProps = {
  children: React.ReactNode
  to: string
  variant?: 'paper' | 'postcard' | 'transparent'
  className?: string
  arrowColor?: string
  external?: boolean
}

export default function PerforatedButton({
  children,
  to,
  variant = 'paper',
  className = '',
  arrowColor = '#EA6962',
  external = false,
}: PerforatedButtonProps) {
  const tooth = 9
  const palette = {
    paper:      { bg: '#FAF7EC', text: '#3C3836', border: 'rgba(0,0,0,0.22)', inner1: 'rgba(0,0,0,0.14)', inner2: 'rgba(0,0,0,0.10)', arrow: arrowColor },
    postcard:   { bg: '#fcfbf7ff', text: '#3C3836', border: 'rgba(0,0,0,0.15)', inner1: 'rgba(0,0,0,0.1)', inner2: 'rgba(0,0,0,0.07)', arrow: arrowColor },
    transparent:{ bg: '#fcfbf71e', text: '#fcfbf7d8', border: 'rgba(0,0,0,0.30)', inner1: 'rgba(0,0,0,0.20)', inner2: 'rgba(0,0,0,0.10)', arrow: arrowColor },
  }[variant]

  const commonClass =
    "group relative inline-flex items-center justify-center " +
    "h-11 px-5 sm:px-6 text-[15px] font-medium transition " +
    "focus:outline-none focus:ring-2 focus:ring-accent/25 " + className

  const commonStyle: React.CSSProperties = {
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
  }

  const content = (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-1 rounded-[2px]" style={{ border: `1px solid ${palette.inner1}` }} />
      <span aria-hidden className="pointer-events-none absolute inset-[6px] rounded-[2px]" style={{ border: `1px solid ${palette.inner2}` }} />
      <span className="relative">{children}</span>
      <svg
        className="relative ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        viewBox="0 0 24 24" fill="none" stroke={palette.arrow} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </>
  )

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClass}
        style={commonStyle}
      >
        {content}
      </a>
    )
  }

  return (
    <Link to={to} className={commonClass} style={commonStyle}>
      {content}
    </Link>
  )
}