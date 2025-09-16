import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/rsvp', label: 'RSVP' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/info', label: 'Info' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-3 py-2 rounded-lg text-sm font-medium',
      isActive ? 'bg-rose/10 text-rose' : 'text-ink/80 hover:text-ink'
    )

  return (
    <></>
  )
}
