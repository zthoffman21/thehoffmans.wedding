import PerforatedButton from "../components/PerforatedButton";
import PaperCard from "../components/PaperCard";

export default function Landing() {
  return (
    <section className="relative bg-[#F2EFE7]">
      {/* Hero with photo + vignette */}
      <div className="relative isolate">
        <div
          className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
          style={{ backgroundImage: "url('/landing-bg.webp?v=3')" }}
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
				<p className="text-sm/6 tracking-widest uppercase opacity-90">July 17, 2026 | 5:00 PM</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<PerforatedButton to="/rsvp" variant="transparent" arrowColor="#fcfbf7d8">
					RSVP
				</PerforatedButton>
				<PerforatedButton
					to="https://www.google.com/maps/place/Aspen+%26+Alston/@40.3431241,-83.1855779,17z/data=!3m1!4b1!4m6!3m5!1s0x8838e705cd847ad5:0x9dc9dce561fde97b!8m2!3d40.34312!4d-83.183003!16s%2Fg%2F11vbybgc95?entry=ttu&g_ep=EgoyMDI1MDkyMi4wIKXMDSoASAFQAw%3D%3D"
					variant="transparent"
					external={true}
					showArrow={false}
				>
					<span className="inline-flex items-center">
						<svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current mr-1.5" aria-hidden>
							<path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						Directions
					</span>
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
          Timing, dress code, parking, and the details people usually ask us for.
        </PaperCard>

        <PaperCard
          title="Travel & Stay"
          subtitle="Nearby hotels & tips"
          accent="sage"
          to="/guide"
          cta="Plan your trip"
          tapeClass="left-1/2 -translate-x-1/2 -top-5 rotate-[3deg] w-36 h-8"
        >
          Places to stay, where to fly in, and a few Columbus spots we like.
        </PaperCard>

        <PaperCard
          title="Photo Gallery"
          subtitle="Guest uploads"
          accent="rose"
          to="/gallery"
          cta="View photos"
          tapeClass="left-1/2 -translate-x-1/2 -top-4 rotate-[1deg] w-28 h-8"
        >
          Add photos from the wedding and see what everyone else posts.
        </PaperCard>
      </div>
    </section>
  );
}