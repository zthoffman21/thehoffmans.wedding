export default function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7EC]/70 backdrop-blur border border-ink/10 p-6 shadow-soft">
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      {subtitle && <p className="mt-1 text-ink/70">{subtitle}</p>}
      <p className="mt-3 text-ink/80">{children}</p>
    </div>
  )
}
