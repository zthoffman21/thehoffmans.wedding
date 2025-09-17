import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
        "px-3 py-2 rounded-lg text-sm font-medium",
        isActive ? "bg-ink/[0.06] text-ink" : "text-ink/80 hover:text-ink"
    );

export default function Navbar() {
    return (
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-[#FAF7EC]/75 border-b border-ink/10">
            <nav className="container-px">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-end gap-2">
                        <span
                            className="leading-none text-[28px] sm:text-[32px] text-ink"
                            style={{ fontFamily: '"Dancing Script", cursive' }}
                        >
                            A&Z
                        </span>
                        <span className="text-xs tracking-wide text-ink/60">July 2026 • Ohio</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2">
                        <NavLink to="/" className={linkClass}>
                            Home
                        </NavLink>
                        <NavLink to="/rsvp" className={linkClass}>
                            RSVP
                        </NavLink>
                        <NavLink to="/gallery" className={linkClass}>
                            Gallery
                        </NavLink>
                        <NavLink to="/info" className={linkClass}>
                            Info
                        </NavLink>
                    </div>
                </div>
            </nav>
        </header>
    );
}
