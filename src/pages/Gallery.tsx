export default function Gallery() {
  return (
    <div className="container-px py-12">
      <h1 className="font-serif text-3xl">Gallery</h1>
      <p className="mt-2 text-ink/80">We'll share photos as we get closer!</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-ink/5 border border-ink/10" />
        ))}
      </div>
    </div>
  )
}