import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
        "px-3 py-2 rounded-lg text-sm font-medium",
        isActive ? "bg-ink/[0.06] text-ink" : "text-ink/80 hover:text-ink"
    );

export default function Navbar() {
    // ...
    return (
        <header className="sticky top-0 z-40 bg-[#F2EFE7]/85 backdrop-blur supports-[backdrop-filter]:bg-[#F2EFE7]/75 border-b border-ink/10">
            <nav className="container-px">
                <div className="flex h-16 items-center justify-between">
                    {/* Earthy cursive logo */}
                    <Link to="/" className="flex items-end gap-2">
                        <span
                            className="leading-none text-[28px] sm:text-[32px]"
                            style={{ fontFamily: '"Dancing Script", cursive', color: "#3C3836" }}
                        >
                            A&Z
                        </span>
                        <span className="text-xs tracking-wide text-ink/60">June 2026 • Ohio</span>
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

                    {/* mobile button remains as you have it */}
                </div>
            </nav>
        </header>
    );
}
