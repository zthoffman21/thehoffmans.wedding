import PerforatedButton from "../components/PerforatedButton";
import PaperCard from "../components/PaperCard";

export default function Landing() {
  return (
    <section className="relative bg-[#F2EFE7]">
      {/* Hero with photo + vignette */}
      <div className="relative isolate">
        <div
          className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
          style={{ backgroundImage: "url('/landing-bg.jpg?v=3')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.20), transparent)," +
              "linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.28))",
          }}
          aria-hidden
        />

        <div className="container-px min-h-[70dvh] sm:min-h-[76dvh] grid place-items-center pt-16 pb-16 sm:pt-24 sm:pb-24">
          <div className="text-center max-w-3xl text-[#F2EFE7] grid gap-5">
            <h1
              className="drop-shadow text-[clamp(40px,7vw,84px)] leading-[0.95]"
              style={{ fontFamily: '"Dancing Script", cursive' }}
            >
              Avery &amp; Zach
            </h1>
			
		  	<div className="grid">
				<p className="text-sm/6 tracking-widest uppercase opacity-90">July 17, 2025 | 5:00 PM</p>
				<div className="mt-8 flex items-center justify-center">
				<PerforatedButton to="/rsvp" variant="transparent" arrowColor="#ea6962d8">
					RSVP
				</PerforatedButton>
				</div>
			</div>
          </div>
        </div>

      </div>

      {/* Paper cards with centered tapes */}
      <div className="container-px -mt-10 sm:-mt-14 pb-20
                grid grid-cols-1
                gap-x-6 gap-y-10
                sm:grid-cols-3 sm:gap-x-6 sm:gap-y-6">
        <PaperCard
          title="What to Expect"
          subtitle="Flow of the day • Dress code"
          accent="accent"
          to="/info"
          cta="Read details"
          tapeClass="left-1/2 -translate-x-1/2 -top-4 rotate-[-4deg] w-32 h-8"
        >
          Ceremony timing, reception vibe, and little things that'll make the day feel
          easy.
        </PaperCard>

        <PaperCard
          title="Travel & Stay"
          subtitle="Nearby hotels & tips"
          accent="sage"
          to="/info"
          cta="Plan your trip"
          tapeClass="left-1/2 -translate-x-1/2 -top-5 rotate-[3deg] w-36 h-8"
        >
          Hotel blocks, local spots we love, parking notes, and airport info.
        </PaperCard>

        <PaperCard
          title="Photo Gallery"
          subtitle="Snapshots & memories"
          accent="rose"
          to="/gallery"
          cta="View photos"
          tapeClass="left-1/2 -translate-x-1/2 -top-4 rotate-[1deg] w-28 h-8"
        >
          A look at our favorite moments and guest candids—add yours, too!
        </PaperCard>
      </div>
    </section>
  );
}