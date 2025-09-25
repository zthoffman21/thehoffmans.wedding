import { useEffect, useState, useCallback } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const WEDDING_ISO = "2026-07-17T00:00:00-04:00";

function countdownLabel(targetISO: string) {
    const now = new Date();
    const target = new Date(targetISO);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Wedding day! 🎉";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 1) return `In ${days} Day`;
    return `In ${days} Days`;
}

export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [elevated, setElevated] = useState(false);
    const [countdown, setCountdown] = useState(() => countdownLabel(WEDDING_ISO));
    const location = useLocation();

    useEffect(() => {
        const id = setInterval(() => {
            setCountdown(countdownLabel(WEDDING_ISO));
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const onScroll = () => setElevated(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Palette aligned to landing/invite
    const paper = "#FAF7EC"; // background paper
    const ink = "#1F1A17"; // text (warm near-black)

    const baseLink =
        "relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[15px] font-medium tracking-tight transition-colors";
    const idle = `text-[${ink}]/85 hover:text-[${ink}]/95`;
    const active = `text-[${ink}]/95`;

    // Tape underline for hover/active
    const tapeUnderline = (active?: boolean) =>
        `${active ? "before:opacity-100" : "hover:before:opacity-100"}
   before:content-[''] before:absolute before:left-3 before:right-3
   before:top-7 before:h-1 before:rounded
   before:block before:pointer-events-none
   before:bg-[#567D9C] 
   before:opacity-0
   before:shadow-[0_1px_0_rgba(0,0,0,0.06)_inset,0_4px_10px_rgba(0,0,0,0.06)]
   before:transition-all before:duration-200`;

    const rsvpBtn = `inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ring-2 ring-[#1F1A17]/25 bg-[#FAF7EC] hover:bg-[#FAF7EC] hover:brightness-95 text-[#1F1A17]`;

    const links = [
        { to: "/", label: "Home" },
        { to: "/info", label: "What to Expect" },
        { to: "/guide", label: "Recommendations" },
        { to: "/gallery", label: "Gallery" },
    ];

    // Route-aware click handler factory
    const onNavClick = useCallback(
        (to: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
            // Always close the mobile panel (no-op on desktop)
            setOpen(false);

            // If clicking the link to the *current* path, intercept and scroll.
            const [path, hash] = to.split("#");
            const samePath = location.pathname === path;

            if (!samePath) return; // normal navigation when target is different

            if (hash) {
                const el = document.getElementById(hash);
                if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: "smooth" });
                }
            } else {
                e.preventDefault();
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }
        },
        [location.pathname]
    );

    return (
        <header
            className={`sticky top-0 z-999 transition-shadow ${
                elevated ? "shadow-[0_16px_30px_-20px_rgba(0,0,0,0.35)]" : ""
            }`}
        >
            {/* Paper bar with gentle blur over hero imagery */}
            <div
                className="backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
                style={{ background: `${paper}CC` }} // paper with ~80% opacity
            >
                {/* Hairline at the bottom like a deckle edge */}
                <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
                <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        {/* Brand / Monogram */}
                        <Link to="/" onClick={onNavClick("/")} className="flex items-end gap-2">
                            <span
                                className="leading-none text-[28px] sm:text-[32px] text-ink"
                                style={{ fontFamily: '"Dancing Script", cursive' }}
                            >
                                A
                                <span className="inline-block text-[.6em] sm:text-[.65em] align-baseline mx-0.5 -translate-y-[2px]">
                                    &amp;
                                </span>
                                Z
                            </span>

                            <span
                                className="text-xs tracking-wide text-ink/60"
                                aria-label="Countdown to wedding"
                            >
                                {countdown} • Ohio
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {links.map((l) => (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    onClick={onNavClick(l.to)}
                                    className={({ isActive }) =>
                                        `${baseLink} ${isActive ? active : idle} ${tapeUnderline(
                                            isActive
                                        )}`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            ))}

                            {/* RSVP emphasized as ribbon */}
                            <Link
                                to="/rsvp"
                                onClick={onNavClick("/rsvp")}
                                className={`ml-2 ${rsvpBtn}`}
                            >
                                RSVP
                            </Link>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setOpen(true)}
                            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F1A17]/25 bg-[#FAF7EC]/70 hover:brightness-95"
                            aria-label="Open menu"
                            aria-expanded={open}
                        >
                            <Menu className="h-5 w-5" color={ink} />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile sheet */}
            <div
                className={`md:hidden fixed inset-0 z-50 ${
                    open ? "pointer-events-auto" : "pointer-events-none"
                }`}
                aria-hidden={!open}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 transition-opacity duration-200 ${
                        open ? "opacity-100" : "opacity-0"
                    } bg-black/30`}
                    onClick={() => setOpen(false)}
                />

                {/* Panel */}
                <div
                    className={`absolute right-0 top-0 h-full w-[88%] max-w-sm
                    bg-[${paper}]/95 backdrop-blur-xl shadow-xl
                    transition-transform duration-200
                    ${open ? "translate-x-0" : "translate-x-full"}
                    flex flex-col`}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Header */}
                    <div className="grid m-3 mb-8">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close menu"
                            className="inline-flex h-11 w-11 items-center justify-center
                    rounded-xl border border-[#1F1A17]/15 bg-[#FAF7EC]/70 hover:brightness-95
                    focus:outline-none focus:ring-2 focus:ring-[#1F1A17]/30 active:scale-[0.98]
                    transition"
                        >
                            <X className="h-6 w-6" color={ink} />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="px-3 pb-6 overflow-y-auto">
                        <div className="grid gap-1">
                            {links.map((l) => (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    onClick={onNavClick(l.to)}
                                    className={({ isActive }) =>
                                        `${baseLink} ${isActive ? active : idle} ${tapeUnderline(
                                            isActive
                                        )}`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            ))}

                            <Link
                                to="/rsvp"
                                onClick={onNavClick("/rsvp")}
                                className={`mt-2 ${rsvpBtn}`}
                            >
                                RSVP
                            </Link>
                        </div>

                        <div
                            className="mt-6 rounded-xl border border-black/10 p-3 text-xs"
                            style={{ color: ink }}
                        >
                            <span className="font-semibold">Tip:</span> RSVP early to help with
                            seating + dessert counts
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
