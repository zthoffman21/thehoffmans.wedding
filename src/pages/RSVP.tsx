import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------
// RSVP Page UI (v1)
// - Matches the soft, paper-card aesthetic we used elsewhere
// - Flow: Search → Party Details → Review & Submit → Confirmation
// - Uses temporary in-memory mock API; replace with real endpoints later
// - Mobile-first; sticky review bar; keyboard- and screen-reader-friendly
// ------------------------------------------------------------

// ----------------------------- Types -----------------------------
export type Member = {
    id: string;
    fullName: string;
    isPlusOne?: boolean; // known plus-ones are explicit Members
    invitedEvents: string[]; // e.g., ["ceremony", "reception"]
    attending: Record<string, boolean>; // { ceremony: true/false, reception: true/false }
    dietary?: string;
    notes?: string;
};

export type Party = {
    id: string;
    displayName: string; // e.g., "David Hoffman Family" or "Avery Tucker"
    contact: {
        email?: string;
        phone?: string;
    };
    members: Member[];
    reminderOptIn?: boolean;
};

// ------------------------- Mock API Layer -------------------------
// Replace these with real calls to your Cloudflare D1-backed API later.
const MOCK_DB: Party[] = [
    {
        id: "party_dhoffman",
        displayName: "David Hoffman Family",
        contact: { email: "david@example.com", phone: "610-555-1299" },
        members: [
            {
                id: "m1",
                fullName: "David Hoffman",
                invitedEvents: ["ceremony", "reception"],
                attending: { ceremony: false, reception: false },
            },
            {
                id: "m2",
                fullName: "Courtney Hoffman",
                invitedEvents: ["ceremony", "reception"],
                attending: { ceremony: false, reception: false },
            },
            {
                id: "m3",
                fullName: "Matthew Hoffman",
                invitedEvents: ["ceremony"],
                attending: { ceremony: false },
            },
        ],
        reminderOptIn: false,
    },
    {
        id: "party_avery",
        displayName: "Avery Tucker (+1)",
        contact: { email: "avery@example.com" },
        members: [
            {
                id: "m4",
                fullName: "Avery Tucker",
                invitedEvents: ["ceremony", "reception"],
                attending: { ceremony: false, reception: false },
            },
            {
                id: "m5",
                fullName: "Plus One (Zachary Hoffman)",
                isPlusOne: true,
                invitedEvents: ["ceremony", "reception"],
                attending: { ceremony: false, reception: false },
            },
        ],
        reminderOptIn: false,
    },
];

async function mockSearchParties(query: string): Promise<Party[]> {
    await new Promise((r) => setTimeout(r, 250));
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_DB.filter((p) => p.displayName.toLowerCase().includes(q));
}

async function mockGetPartyById(id: string): Promise<Party | null> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_DB.find((p) => p.id === id) ?? null;
}

// Pretend submit; echo the payload
async function mockSubmitRSVP(payload: Party): Promise<{ ok: boolean; id: string }> {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, id: payload.id };
}

// --------------------------- Utilities ---------------------------
function classNames(...parts: (string | false | undefined)[]) {
    return parts.filter(Boolean).join(" ");
}

function formatEventLabel(key: string) {
    switch (key) {
        case "ceremony":
            return "Ceremony";
        case "reception":
            return "Reception";
        default:
            return key;
    }
}

// ---------------------------- UI Parts ---------------------------
function SearchSection({ onPick }: { onPick: (id: string) => void }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<Party[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handle = setTimeout(async () => {
            if (!q.trim()) {
                setResults(null);
                return;
            }
            setLoading(true);
            const res = await mockSearchParties(q);
            setResults(res);
            setLoading(false);
        }, 250);
        return () => clearTimeout(handle);
    }, [q]);

    return (
        <section className="mx-auto max-w-2xl px-4 py-10">
            <div className="rounded-2xl border border-black/5 bg-[#FAF7EC]/80 shadow-sm backdrop-blur">
                <div className="p-5 sm:p-7">
                    <h1 className="font-serif text-2xl leading-tight text-ink">
                        Find your invitation
                    </h1>
                    <p className="mt-1 text-sm text-ink/70">
                        Search your family or individual name exactly as it might appear on the
                        envelope (e.g., "David Hoffman Family" or "Avery Tucker").
                    </p>

                    <div className="mt-5 flex gap-2">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-4 py-3 text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                            aria-label="Search name"
                        />
                        <button
                            onClick={() => void 0}
                            className="
							hidden rounded-xl bg-ink px-4 py-3 text-ink sm:block
							transition duration-200 ease-out
							hover:bg-ink/5 hover:-translate-y-[1px]
							"
                            aria-hidden
                        >
                            Search
                        </button>
                    </div>

                    <div className="mt-6">
                        {loading && <div className="text-sm text-ink/70">Searching…</div>}
                        {results && results.length === 0 && !loading && (
                            <div className="rounded-xl border border-ink/10 bg-amber-50 p-4 text-sm text-ink">
                                We couldn't find a match. Try a different variation or reach out to
                                us.
                            </div>
                        )}
                        {results && results.length > 0 && (
                            <ul className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10">
                                {results.map((p) => (
                                    <li key={p.id} className="group bg-[#FAF7EC]/70 backdrop-blur">
                                        <button
                                            onClick={() => onPick(p.id)}
                                            className="
            flex w-full items-center justify-between px-4 py-3
            text-left
            transition
            duration-200
            ease-out
            hover:bg-ink/5
            hover:shadow-sm
            hover:-translate-y-[1px]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-accent/60
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#FAF7EC]
          "
                                        >
                                            <span className="text-ink">{p.displayName}</span>
                                            <span className="text-xs text-ink/60">
                                                {p.members.length} guest(s)
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function MemberCard({
    member,
    onToggle,
    onDietary,
    onNotes,
}: {
    member: Member;
    onToggle: (eventKey: string, value: boolean) => void;
    onDietary: (val: string) => void;
    onNotes: (val: string) => void;
}) {
    const eventKeys = Object.keys(member.attending);
    return (
        <div
            className={classNames(
                "rounded-2xl border border-ink/10 bg-[#FAF7EC] p-4 shadow-sm",
                member.isPlusOne && "ring-1 ring-accent/30"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="font-medium text-ink">
                        {member.fullName}
                        {member.isPlusOne && (
                            <span className="ml-2 align-middle rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-ink/80">
                                plus one
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-xs text-ink/60">
                        Invited: {member.invitedEvents.map(formatEventLabel).join(", ")}
                    </div>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {eventKeys.map((key) => (
                    <label
                        key={key}
                        className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2"
                    >
                        <input
                            type="checkbox"
                            checked={!!member.attending[key]}
                            onChange={(e) => onToggle(key, e.target.checked)}
                            className="size-4 rounded border-ink/30 text-ink focus:ring-ink"
                        />
                        <span className="text-sm text-ink">Attending {formatEventLabel(key)}</span>
                    </label>
                ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                    value={member.dietary ?? ""}
                    onChange={(e) => onDietary(e.target.value)}
                    placeholder="Dietary needs (optional)"
                    className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-3 py-2 text-sm text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                />
                <input
                    value={member.notes ?? ""}
                    onChange={(e) => onNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-3 py-2 text-sm text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                />
            </div>
        </div>
    );
}

function ContactPanel({
    contact,
    onChange,
}: {
    contact: { email?: string; phone?: string };
    onChange: (c: { email?: string; phone?: string }) => void;
}) {
    return (
        <div className="rounded-2xl border border-ink/10 bg-[#FAF7EC] p-4 shadow-sm">
            <h3 className="font-medium text-ink">Contact info</h3>
            <p className="mt-1 text-xs text-ink/60">
                We'll use this if we need to reach you about any details.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                    type="email"
                    value={contact.email ?? ""}
                    onChange={(e) => onChange({ ...contact, email: e.target.value })}
                    placeholder="Email (optional)"
                    className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-3 py-2 text-sm text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                />
                <input
                    type="tel"
                    value={contact.phone ?? ""}
                    onChange={(e) => onChange({ ...contact, phone: e.target.value })}
                    placeholder="Phone (optional)"
                    className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-3 py-2 text-sm text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                />
            </div>
        </div>
    );
}

function ReviewBar({
    party,
    onSubmit,
    onBack,
    submitting,
}: {
    party: Party;
    onSubmit: () => void;
    onBack: () => void;
    submitting: boolean;
}) {
    const counts = useMemo(() => {
        let invited = 0;
        let attending = 0;
        party.members.forEach((m) => {
            invited += m.invitedEvents.length; // count event invites
            attending += Object.values(m.attending).filter(Boolean).length;
        });
        return { invited, attending };
    }, [party]);

    return (
        <div className="fixed inset-x-0 bottom-2 z-50 mx-auto max-w-3xl px-4 pb-[env(safe-area-inset-bottom)]">
            <div className="rounded-2xl border border-ink/10 bg-[#FAF7EC]/95 p-3 shadow-xl backdrop-blur">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="text-center sm:text-left">
                        <div className="text-sm font-medium text-ink">Ready to submit?</div>
                        <div className="text-xs text-ink/60">
                            {counts.attending} attending selections made across{" "}
                            {party.members.length} guest(s).
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-xl border border-ink/20 bg-[#FAF7EC] px-4 py-2 text-sm text-ink hover:brightness-95"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={submitting}
                            className={classNames(
                                "rounded-xl border border-ink/20 bg-[#FAF7EC] px-4 py-2 text-sm text-ink hover:brightness-95",
                                submitting && "opacity-60"
                            )}
                        >
                            {submitting ? "Submitting…" : "Submit RSVP"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PartySection({
    party,
    setParty,
    onBackToSearch,
    onSubmitted,
}: {
    party: Party;
    setParty: (p: Party) => void;
    onBackToSearch: () => void;
    onSubmitted: (id: string) => void;
}) {
    const [submitting, setSubmitting] = useState(false);

    function updateMember(id: string, updater: (m: Member) => Member) {
        setParty({
            ...party,
            members: party.members.map((m) => (m.id === id ? updater(m) : m)),
        });
    }

    async function handleSubmit() {
        setSubmitting(true);
        const res = await mockSubmitRSVP(party);
        setSubmitting(false);
        if (res.ok) onSubmitted(res.id);
    }

    return (
        <section className="mx-auto mb-28 max-w-3xl px-4 py-8">
            <button onClick={onBackToSearch} className="text-sm text-[#F2EFE7]/70 hover:underline">
                ← Back
            </button>

            <h2 className="mt-2 font-serif text-2xl text-[#F2EFE7]">{party.displayName}</h2>
            <p className="mt-1 text-sm text-[#F2EFE7]/70">
                Toggle who's attending each event, then add dietary needs or notes if needed.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4">
                {party.members.map((m) => (
                    <MemberCard
                        key={m.id}
                        member={m}
                        onToggle={(eventKey, value) =>
                            updateMember(m.id, (mm) => ({
                                ...mm,
                                attending: { ...mm.attending, [eventKey]: value },
                            }))
                        }
                        onDietary={(val) => updateMember(m.id, (mm) => ({ ...mm, dietary: val }))}
                        onNotes={(val) => updateMember(m.id, (mm) => ({ ...mm, notes: val }))}
                    />
                ))}

                <ContactPanel
                    contact={party.contact}
                    onChange={(c) => setParty({ ...party, contact: c })}
                />
                <ReminderToggle
                    email={party.contact.email}
                    optIn={party.reminderOptIn}
                    onChange={(val) => setParty({ ...party, reminderOptIn: val })}
                />
            </div>

            <div aria-hidden className="h-18 sm:h-16" />

            <ReviewBar
                party={party}
                onSubmit={handleSubmit}
                onBack={onBackToSearch}
                submitting={submitting}
            />
        </section>
    );
}

function ConfirmationSection({ partyId, onReset }: { partyId: string; onReset: () => void }) {
    return (
        <section className="mx-auto max-w-2xl px-4 py-14 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-[#FAF7EC] p-8 shadow-sm">
                <div
                    className="mx-auto mb-3 size-12 rounded-full border border-ink/10 bg-[#A7C080]"
                    aria-hidden
                />
                <h2 className="font-serif text-2xl text-ink">RSVP received</h2>
                <p className="mt-2 text-sm text-ink/70">
                    Thank you! Your responses have been recorded. You can close this page or look up
                    your invitation again to make changes.
                </p>
                <button
                    onClick={onReset}
                    className="mt-6 rounded-xl border border-ink/20 bg-[#FAF7EC] px-4 py-2 text-sm text-ink hover:bg-ink/5"
                >
                    Look up another invitation
                </button>
            </div>
        </section>
    );
}

function ReminderToggle({
    email,
    optIn,
    onChange,
}: {
    email?: string;
    optIn: boolean | undefined;
    onChange: (val: boolean) => void;
}) {
    const disabled = !email;

    return (
        <div className="rounded-2xl border border-ink/10 bg-[#FAF7EC] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                {" "}
                <div>
                    <h3 className="font-medium text-ink">Email reminder</h3>
                    <p className="mt-1 text-xs text-ink/60">
                        We'll send gentle reminders to{" "}
                        <span className="font-medium">{email || "—"}</span>.
                    </p>
                </div>
                <label className="inline-flex select-none items-center gap-3 h-10">
                    {" "}
                    <input
                        type="checkbox"
                        className="
          size-5 sm:size-6 shrink-0                       /* bigger box */
          scale-110 translate-y-[0.5px]                   /* tiny optical nudge */
          rounded border-ink/30 accent-ink focus:ring-ink /* color + focus */
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7EC]
        "
                        disabled={disabled}
                        checked={!!optIn && !disabled}
                        onChange={(e) => onChange(e.target.checked)}
                        aria-label="Enable email reminder"
                    />
                    <span
                        className={
                            disabled
                                ? "text-ink/40 text-sm leading-none"
                                : "text-ink text-sm leading-none"
                        }
                    >
                        Enable
                    </span>
                </label>
            </div>
        </div>
    );
}

// ---------------------------- Page Shell ----------------------------
export default function RSVP() {
    const [step, setStep] = useState<"search" | "party" | "confirm">("search");
    const [partyId, setPartyId] = useState<string | null>(null);
    const [party, setParty] = useState<Party | null>(null);
    const [loadingParty, setLoadingParty] = useState(false);

    async function handlePick(id: string) {
        setPartyId(id);
        setLoadingParty(true);
        const p = await mockGetPartyById(id);
        setParty(p ?? null);
        setLoadingParty(false);
        if (p) setStep("party");
    }

    function resetAll() {
        setStep("search");
        setPartyId(null);
        setParty(null);
    }

    return (
        <>
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[url('/rsvp-bg.jpg')] bg-cover bg-center bg-no-repeat" />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.10), transparent), " +
                            "linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.12))",
                    }}
                />
            </div>

            {/* Content */}
            <main className="relative min-h-screen">
                <div className="relative">
                    {step === "search" && <SearchSection onPick={handlePick} />}
                    {step === "party" &&
                        party &&
                        (loadingParty ? (
                            <section className="mx-auto max-w-2xl px-4 py-10 text-ink/70">
                                Loading…
                            </section>
                        ) : (
                            <PartySection
                                party={party}
                                setParty={setParty}
                                onBackToSearch={resetAll}
                                onSubmitted={() => setStep("confirm")}
                            />
                        ))}
                    {step === "confirm" && (
                        <ConfirmationSection partyId={partyId ?? ""} onReset={resetAll} />
                    )}
                </div>
            </main>
        </>
    );
}
