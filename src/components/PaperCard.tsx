import PerforatedButton from "../components/PerforatedButton";
import { Tape } from "./Tape";

export default function PaperCard({
  title,
  subtitle,
  accent = "accent",
  to = "/info",
  cta = "Learn more",
  tapeClass = "",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: "accent" | "rose" | "sage";
  to?: string;
  cta?: string;
  tapeClass?: string;
  children: React.ReactNode;
}) {
  const dot = { accent: "#449cbdff", rose: "#EA6962", sage: "#A7C080" }[accent];

  return (
    <div className="relative">
      <div className="relative rounded-[16px] border border-neutral-300 bg-[#FAF7EC] shadow-xl overflow-hidden">
        <div className="absolute inset-2 rounded-[12px] border border-neutral-300/70 pointer-events-none z-10" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none z-0"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 22% 28%, rgba(0,0,0,.5) 1px, transparent 1px), radial-gradient(1px 1px at 72% 62%, rgba(0,0,0,.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px, 22px 22px",
          }}
        />
        <div className="relative z-20 p-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
            <h3 className="font-serif text-[20px] text-ink">{title}</h3>
          </div>
          {subtitle && <p className="mt-1 text-ink/70 text-sm">{subtitle}</p>}
          <p className="mt-3 text-ink/85">{children}</p>

          <div className="mt-5">
            <PerforatedButton to={to} arrowColor={dot} variant="paper" className="h-10 px-4 text-[14px]">
              {cta}
            </PerforatedButton>
          </div>
        </div>
      </div>

      <div className={`absolute ${tapeClass} z-[500] pointer-events-none`}>
        <Tape className="h-full w-full"/>
      </div>
    </div>
  );
}