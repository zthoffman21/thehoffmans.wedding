import { Link } from 'react-router-dom'
import Card from '../components/Card'

export default function RSVP() {
  return (
    <section>
      {/* Hero */}
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_20rem_at_80%_-10%,rgba(215,153,33,0.15),transparent),radial-gradient(30rem_15rem_at_20%_-10%,rgba(234,105,98,0.12),transparent)]" />
        <div className="container-px pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight">
              Zach &amp; Avery
            </h1>
            <p className="mt-4 text-lg text-ink/80">
              Join us in celebrating our wedding
              <br className="hidden sm:block" />
              <span className="font-medium text-ink">June 2026 • Ohio</span>
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                to="/rsvp"
                className="rounded-xl bg-accent text-white px-5 py-3 font-medium shadow-soft hover:opacity-90"
              >
                RSVP
              </Link>
              <Link
                to="/info"
                className="rounded-xl border border-ink/20 px-5 py-3 font-medium hover:bg-ink/5"
              >
                Event Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="container-px pb-20 grid gap-6 sm:grid-cols-3">
        <Card title="Ceremony" subtitle="Wildflower Meadow, Ohio">
          We’ll keep it simple and meaningful. Dress comfortably.
        </Card>
        <Card title="Reception" subtitle="String lights • Pizza • Music">
          Casual, cozy vibes. Bring your best dance moves.
        </Card>
        <Card title="Travel & Stay" subtitle="Nearby hotels & tips">
          See recommendations and group rates on the Info page.
        </Card>
      </div>
    </section>
  )
}