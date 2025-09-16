export default function Info() {
return (
<div className="container-px py-12 max-w-3xl mx-auto">
<h1 className="font-serif text-3xl">Event Info</h1>
<div className="mt-6 space-y-6">
<Section title="Schedule">
<ul className="list-disc pl-5 text-ink/80">
<li>4:00 PM — Ceremony</li>
<li>5:00 PM — Photos & Mingling</li>
<li>6:00 PM — Dinner & Toasts</li>
<li>7:30 PM — Dancing</li>
</ul>
</Section>
<Section title="Venue">
<p className="text-ink/80">Wildflower Meadow • Ohio (exact address TBA)</p>
</Section>
<Section title="Travel & Stay">
<p className="text-ink/80">Hotel recommendations and group rates coming soon.</p>
</Section>
</div>
</div>
)
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
return (
<section>
<h2 className="font-serif text-2xl">{title}</h2>
<div className="mt-2">{children}</div>
</section>
)
}