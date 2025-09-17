import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu } from "lucide-react";

/**
 * NavBar – Wedding theme (invite/landing) styled
 * - Paper background (#F2EFE7), ink text (#1F1A17), sage accents
 * - Subtle washi "tape" hover/active underline
 * - Sticky with backdrop blur; mobile slide-over
 */
export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);

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
   before:bg-[#449cbdff] 
   before:opacity-0
   before:shadow-[0_1px_0_rgba(0,0,0,0.06)_inset,0_4px_10px_rgba(0,0,0,0.06)]
   before:transition-all before:duration-200`;
   
  const rsvpBtn =
    `inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ring-2 ring-[#1F1A17]/25 bg-[#FAF7EC] hover:bg-[#FAF7EC] hover:brightness-95 text-[#1F1A17]`;

  const links = [
    { to: "/", label: "Home" },
    { to: "/info", label: "What to Expect" },
    { to: "/guide", label: "Recommendations" },
    { to: "/gallery", label: "Gallery" },
  ];

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
            <Link to="/" className="flex items-end gap-2">
                <span
                    className="leading-none text-[28px] sm:text-[32px] text-ink"
                    style={{ fontFamily: '"Dancing Script", cursive' }}
                >
                    A&Z
                </span>
                <span className="text-xs tracking-wide text-ink/60">July 2026 • Ohio</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : idle} ${tapeUnderline(isActive)}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {/* RSVP emphasized as ribbon */}
              <Link to="/rsvp" className={`ml-2 ${rsvpBtn}`}>
                RSVP
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F1A17]/25 bg-[#FAF7EC]/70 hover:bg-white/90"
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
                    flex flex-col`}   // ⬅️ make it a column
        role="dialog"
        aria-modal="true"
        >
        {/* Header */}
        <div className="p-4">
            <div className="relative rounded-xl border border-black/10 p-3">
            <div className="font-serif text-lg" style={{ color: ink }}>
                Menu
            </div>
            </div>
        </div>

        {/* Scrollable content */}
        <div className="px-3 pb-6 overflow-y-auto">
            <div className="grid gap-1">
            {links.map((l) => (
                <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : idle} ${tapeUnderline(isActive)}`
                }
                >
                {l.label}
                </NavLink>
            ))}

            <Link
                to="/rsvp"
                onClick={() => setOpen(false)}
                className={`mt-2 ${rsvpBtn}`}
            >
                RSVP
            </Link>
            </div>

            <div className="mt-6 rounded-xl border border-black/10 p-3 text-xs" style={{ color: ink }}>
            <span className="font-semibold">Tip:</span> RSVP early to help with seating + dessert counts
            </div>
        </div>

        {/* Sticky bottom close button */}
        <div className="mt-auto sticky bottom-0">
            <div className="border-t border-black/10 bg-[#FAF7EC] backdrop-blur px-4 py-3
                            pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold
                        text-[#1F1A17] ring-1 ring-[#1F1A17]/15
                        bg-white/70 hover:bg-white/90 transition"
                aria-label="Close menu"
            >
                Close
            </button>
            </div>
        </div>
        </div>
      </div>
    </header>
  );
}