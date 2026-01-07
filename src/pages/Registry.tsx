const ZOLA_REGISTRY_URL =
    "https://www.zola.com/registry/averytandzachh/";

interface RegistryCardProps {
    eyebrow: string;
    title: string;
    body: string;
    buttonLabel: string;
    href: string;
    subtleNote?: string;
}

function RegistryCard({
    eyebrow,
    title,
    body,
    buttonLabel,
    href,
    subtleNote,
}: RegistryCardProps) {
    return (
        <div className="rounded-2xl bg-[#FAF7EC]/95 shadow-[0_6px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur-sm p-6 sm:p-8 text-center space-y-4">
            <p className="text-sm/6 tracking-widest uppercase text-ink/70">
                {eyebrow}
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink">
                {title}
            </h2>
            <p className="text-sm text-ink/70 max-w-2xl mx-auto">
                {body}
            </p>

            <div className="pt-4">
                <a
                    className="inline-flex items-center justify-center rounded-xl bg-[#1F1A17] px-5 py-3 text-base font-semibold text-[#FAF7EC] shadow-md hover:brightness-110 transition"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                >
                    {buttonLabel}
                </a>
            </div>

            {subtleNote && (
                <p className="text-xs text-ink/50">
                    {subtleNote}
                </p>
            )}
        </div>
    );
}

export default function Registry() {
    return (
        <section className="relative min-h-screen bg-[#F2EFE7]">
            {/* Background image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%]"
                style={{ backgroundImage: "url('/registry-bg.webp?v=3')" }}
                aria-hidden
            />
            {/* Vignette overlay */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.20), transparent)," +
                        "linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.28))",
                }}
                aria-hidden
            />

            {/* Content */}
            <div className="relative z-20">
                <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20 space-y-10">
                    <header className="flex flex-col items-center text-center text-[#F2EFE7]">
                        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
                            Registry
                        </h1>
                        <p className="mt-4 max-w-2xl text-base/7 opacity-95">
                            Your presence is the greatest gift, but if you want to honor us with a gift, we have registered at the link below.
                        </p>
                    </header>

                    {/* Cards */}
                    <div className="flex flex-col md:grid-cols-2">
                        <div className="mx-auto w-full max-w-lg space-y-8 md:space-y-0 md:grid md:gap-8">
                            <RegistryCard
                                eyebrow="Registry"
                                title="Zola Registry"
                                body="Our registry is hosted on Zola, with a mix of kitchen items, household items, and others. You can view the full list using the button below."
                                buttonLabel="View Registry on Zola"
                                href={ZOLA_REGISTRY_URL}
                                subtleNote="Opens in a new tab on Zola."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
