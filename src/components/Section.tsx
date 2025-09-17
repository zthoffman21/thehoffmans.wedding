export default function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
