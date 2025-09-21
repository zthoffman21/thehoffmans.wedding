import { useEffect, useState } from "react";
import { searchParties as apiSearchParties } from "../../api/rsvp";
import { formatNYDateTime } from "../../lib/time";

type SubmissionRow = {
    submission_id: string;
    submitted_at: string;
    party_id: string;
    party_name: string | null;
    member_id?: string | null;
    member_name?: string | null;

    phone: string;
    email: string;
    email_reminders: boolean;
    attending_ceremony: boolean | "";
    attending_reception: boolean | "";
    dietary: string;
    notes: string;
};

export default function AdminDashboard() {
    const [tab, setTab] = useState<"overview" | "submissions" | "missing" | "manage">("overview");
    return (
        <section className="relative min-h-screen bg-[#F2EFE7] overflow-x-hidden">
            <div
                className="absolute inset-0 z-0 bg-cover bg-[center_55%] sm:bg-[center_40%] md:bg-[center_57.5%] pointer-events-none"
                style={{ backgroundImage: "url('/admin-bg.webp?v=3')" }}
                aria-hidden
            />

            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(70rem 35rem at 50% -10%, rgba(0,0,0,0.20), transparent)," +
                        "linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.28))",
                }}
                aria-hidden
            />
            <section className="relative z-20 mx-auto max-w-6xl p-6 text-ink">
                <h1 className="mb-6 text-3xl font-semibold">Admin Dashboard</h1>
                <nav className="mb-6 flex gap-2">
                    {["overview", "submissions", "missing", "manage"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t as any)}
                            className={`rounded-xl border px-3 py-1 ${
                                tab === t ? "bg-ink text-[#FAF7EC]" : "bg-[#FAF7EC]"
                            }`}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                    <a
                        className="ml-auto rounded-xl border px-3 py-1"
                        href="/api/admin/export/latest-rsvps"
                    >
                        Export RSVPs
                    </a>
                </nav>

                {tab === "overview" && <Overview />}
                {tab === "submissions" && <Submissions />}
                {tab === "missing" && <Missing />}
                {tab === "manage" && <Manage />}
            </section>
        </section>
    );
}

function Overview() {
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        fetch("/api/admin/overview")
            .then((r) => r.json())
            .then(setData);
    }, []);
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
                {[
                    { label: "Parties", value: data?.counts?.parties ?? "—" },
                    { label: "Members", value: data?.counts?.members ?? "—" },
                    { label: "Submissions", value: data?.counts?.submissions ?? "—" },
                ].map((c) => (
                    <div key={c.label} className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                        <div className="text-sm text-ink/60">{c.label}</div>
                        <div className="text-2xl font-semibold">{c.value}</div>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">Recent Submissions (7 days)</h2>
                <ul className="divide-y">
                    {(data?.recentSubmissions ?? []).map((s: any) => (
                        <li key={s.id} className="py-2 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{s.party_name ?? s.party_id}</div>
                            </div>
                            <div className="text-sm text-ink/60">
                                {formatNYDateTime(s.submitted_at)}
                            </div>
                        </li>
                    ))}
                    {(!data?.recentSubmissions || data.recentSubmissions.length === 0) && (
                        <div className="py-4 text-sm text-ink/60">No recent submissions.</div>
                    )}
                </ul>
            </div>
        </div>
    );
}

function Submissions() {
    const [items, setItems] = useState<SubmissionRow[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const load = async (cursor?: string | null) => {
        setLoading(true);
        const url = new URL("/api/admin/submissions", location.origin);
        url.searchParams.set("limit", "25");
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url).then((r) => r.json());
        setItems((prev) => (cursor ? [...prev, ...res.items] : res.items));
        setNext(res.nextCursor ?? null);
        setLoading(false);
    };
    useEffect(() => {
        load(null);
    }, []);

    return (
        <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Submissions</h2>
                <div className="text-sm text-ink/60">
                    Showing {items.length} row{items.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className="overflow-auto rounded-lg border">
                <table className="min-w-[960px] w-full text-sm">
                    <thead className="bg-[#d6d4ca] text-ink/80">
                        <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                            <th>Submitted</th>
                            <th>Party Name</th>
                            <th>Member Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Email Reminders</th>
                            <th>Attending Ceremony</th>
                            <th>Attending Reception</th>
                            <th>Dietary</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2 divide-y">
                        {items.map((r) => (
                            <tr key={`${r.submission_id}:${r.member_id ?? "party"}`}>
                                <td className="whitespace-nowrap">
                                    {formatNYDateTime(r.submitted_at)}
                                </td>
                                <td
                                    className="max-w-[220px] truncate"
                                    title={r.party_name ?? r.party_id}
                                >
                                    {r.party_name ?? r.party_id}
                                </td>
                                <td className="max-w-[220px] truncate" title={r.member_name ?? "—"}>
                                    {r.member_name ?? "—"}
                                </td>
                                <td className="whitespace-nowrap">{r.phone}</td>
                                <td className="max-w-[220px] truncate" title={r.email}>
                                    {r.email}
                                </td>
                                <td>{r.email_reminders ? "Yes" : "No"}</td>
                                <td>
                                    {r.attending_ceremony === ""
                                        ? "—"
                                        : r.attending_ceremony
                                        ? "Yes"
                                        : "No"}
                                </td>
                                <td>
                                    {r.attending_reception === ""
                                        ? "—"
                                        : r.attending_reception
                                        ? "Yes"
                                        : "No"}
                                </td>
                                <td className="max-w-[200px] truncate" title={r.dietary}>
                                    {r.dietary || "—"}
                                </td>
                                <td className="max-w-[320px] truncate" title={r.notes}>
                                    {r.notes || "—"}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={10} className="py-6 text-center text-ink/60">
                                    No submissions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                {next ? (
                    <button
                        className="rounded-lg border px-3 py-1"
                        disabled={loading}
                        onClick={() => load(next)}
                    >
                        {loading ? "Loading…" : "Load more"}
                    </button>
                ) : (
                    <span className="text-sm text-ink/60">No more results.</span>
                )}
            </div>
        </div>
    );
}

function Missing() {
    const [data, setData] = useState<{ membersNoRSVP: any[]; partiesNoRSVP: any[] }>();
    useEffect(() => {
        fetch("/api/admin/missing")
            .then((r) => r.json())
            .then(setData);
    }, []);
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">Members w/ no RSVP</h2>
                <ul className="max-h-[28rem] divide-y overflow-auto">
                    {(data?.membersNoRSVP ?? []).map((m) => (
                        <li key={m.member_id} className="py-2">
                            <div className="font-medium">{m.full_name}</div>
                            <div className="text-sm text-ink/60">{m.display_name}</div>
                        </li>
                    ))}
                    {(!data?.membersNoRSVP || data.membersNoRSVP.length === 0) && (
                        <div className="py-4 text-sm text-ink/60">
                            Great! Everyone has responded.
                        </div>
                    )}
                </ul>
            </div>
            <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">Parties w/ no RSVP</h2>
                <ul className="max-h-[28rem] divide-y overflow-auto">
                    {(data?.partiesNoRSVP ?? []).map((p) => (
                        <li key={p.id} className="py-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.display_name}</div>
                                    <div className="text-sm text-ink/60">
                                        {p.member_count} members
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(!data?.partiesNoRSVP || data.partiesNoRSVP.length === 0) && (
                        <div className="py-4 text-sm text-ink/60">
                            All parties have at least one submission.
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
}

type PartyDetail = {
    id: string;
    slug: string;
    display_name: string;
    contact_email?: string | null;
    contact_phone?: string | null;
    reminder_opt_in: number;
    can_rsvp: number;
    rsvp_deadline?: string | null;
    members: Array<MemberDetail>;
};

type MemberDetail = {
    id: string;
    party_id: string;
    full_name: string;
    is_plus_one: number;
    plus_one_for?: string | null;
    sort_order: number;
    invite_ceremony: number;
    invite_reception: number;
    // attendance
    attending_ceremony?: number | null;
    attending_reception?: number | null;
    dietary?: string | null;
    notes?: string | null;
};

function Manage() {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<Array<{ id: string; label: string }> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [party, setParty] = useState<PartyDetail | null>(null);

    // Debounced search (same pattern as RSVP SearchSection)
    useEffect(() => {
        const handle = setTimeout(async () => {
            const query = q.trim();
            if (!query) {
                setResults(null);
                setError(null);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const res = await apiSearchParties(query);
                setResults(res);
            } catch {
                setError("Search failed. Please try again.");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(handle);
    }, [q]);

    async function loadParty(id: string) {
        const res = await fetch(`/api/admin/party/${id}`, { cache: "no-store" }).then((r) =>
            r.json()
        );
        setParty(res.party ?? null);
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
            {/* Left: search & results (RSVP-like) */}
            <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold">Find a party</h2>
                <div className="flex gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Enter party or member name…"
                        className="w-full rounded-xl border border-ink/15 bg-[#FAF7EC] px-4 py-3 text-ink shadow-inner outline-none ring-accent/30 focus:border-accent/50 focus:ring"
                        aria-label="Search name"
                    />
                </div>

                <div className="mt-4">
                    {loading && <div className="text-sm text-ink/70">Searching…</div>}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {results && results.length === 0 && !loading && !error && (
                        <div className="rounded-xl border border-ink/10 bg-amber-50 p-4 text-sm text-ink">
                            We couldn't find a match. Try a different variation.
                        </div>
                    )}
                    {results && results.length > 0 && (
                        <ul className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10">
                            {results.map((p) => (
                                <li key={p.id} className="group bg-[#FAF7EC]/70 backdrop-blur">
                                    <button
                                        onClick={() => loadParty(p.id)}
                                        className="flex w-full items-center justify-between px-4 py-3 text-left transition duration-200 ease-out hover:bg-ink/5 hover:shadow-sm hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7EC]"
                                    >
                                        <span className="text-ink">{p.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right: your existing editor */}
            <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                {!party ? (
                    <div className="text-ink/60">Pick a party to edit.</div>
                ) : (
                    <PartyEditor
                        party={party}
                        onChange={setParty}
                        onReload={() => loadParty(party.id)}
                    />
                )}
            </div>
        </div>
    );
}

function PartyEditor({
    party,
    onChange,
    onReload,
}: {
    party: PartyDetail;
    onChange: (p: PartyDetail) => void;
    onReload: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function saveParty() {
        setSaving(true);
        await fetch(`/api/admin/party/${party.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug: party.slug,
                display_name: party.display_name,
                contact_email: party.contact_email,
                contact_phone: party.contact_phone,
                reminder_opt_in: party.reminder_opt_in,
                can_rsvp: party.can_rsvp,
                rsvp_deadline: party.rsvp_deadline,
            }),
        });
        setSaving(false);
        onReload();
    }

    async function deleteParty() {
        if (
            !confirm(
                "Delete party and all related members/attendance/submissions? This cannot be undone."
            )
        )
            return;
        setDeleting(true);
        await fetch(`/api/admin/party/${party.id}`, { method: "DELETE" });
        setDeleting(false);
        onChange(null as any);
    }

    async function addMember() {
        const res = await fetch(`/api/admin/member`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                party_id: party.id,
                full_name: "New Guest",
                sort_order: (party.members.at(-1)?.sort_order ?? 0) + 10,
            }),
        }).then((r) => r.json());
        onReload();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">{party.display_name}</h2>
                    <div className="text-sm text-ink/60">{party.id}</div>
                </div>
                <button onClick={deleteParty} className="rounded-lg border px-3 py-1 bg-[#ffe6e6]">
                    {deleting ? "Deleting…" : "Delete party"}
                </button>
            </div>

            {/* Party fields */}
            <div className="grid sm:grid-cols-2 gap-3">
                <L label="Display name">
                    <I
                        value={party.display_name}
                        onChange={(v) => onChange({ ...party, display_name: v })}
                    />
                </L>
                <L label="Slug">
                    <I value={party.slug} onChange={(v) => onChange({ ...party, slug: v })} />
                </L>
                <L label="Contact email">
                    <I
                        value={party.contact_email ?? ""}
                        onChange={(v) => onChange({ ...party, contact_email: v })}
                    />
                </L>
                <L label="Contact phone">
                    <I
                        value={party.contact_phone ?? ""}
                        onChange={(v) => onChange({ ...party, contact_phone: v })}
                    />
                </L>
                <L label="Reminders opt-in">
                    <C
                        checked={!!party.reminder_opt_in}
                        onChange={(b) => onChange({ ...party, reminder_opt_in: b ? 1 : 0 })}
                    />
                </L>
                <L label="Can RSVP">
                    <C
                        checked={!!party.can_rsvp}
                        onChange={(b) => onChange({ ...party, can_rsvp: b ? 1 : 0 })}
                    />
                </L>
                <L label="RSVP deadline (ISO)">
                    <I
                        value={party.rsvp_deadline ?? ""}
                        onChange={(v) => onChange({ ...party, rsvp_deadline: v || null })}
                        placeholder="YYYY-MM-DDTHH:mm:ssZ"
                    />
                </L>
            </div>

            <div className="flex gap-2">
                <button onClick={saveParty} className="rounded-lg border px-3 py-2">
                    {saving ? "Saving…" : "Save party"}
                </button>
                <button onClick={addMember} className="rounded-lg border px-3 py-2">
                    Add member
                </button>
            </div>

            {/* Members */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold">Members</h3>
                {party.members.map((m) => (
                    <MemberRow key={m.id} m={m} onSaved={onReload} />
                ))}
                {party.members.length === 0 && (
                    <div className="text-sm text-ink/60">No members yet.</div>
                )}
            </div>
        </div>
    );
}

function MemberRow({ m, onSaved }: { m: MemberDetail; onSaved: () => void }) {
    const [state, setState] = useState<MemberDetail>(m);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function save() {
        setSaving(true);
        await fetch(`/api/admin/member/${state.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state),
        });
        setSaving(false);
        onSaved();
    }
    async function del() {
        if (!confirm("Delete this member? This cannot be undone.")) return;
        setDeleting(true);
        await fetch(`/api/admin/member/${state.id}`, { method: "DELETE" });
        setDeleting(false);
        onSaved();
    }

    return (
        <div className="rounded-xl border bg-white p-3">
            <div className="grid sm:grid-cols-2 gap-3">
                <L label="Full name">
                    <I
                        value={state.full_name}
                        onChange={(v) => setState({ ...state, full_name: v })}
                    />
                </L>
                <L label="Sort order">
                    <I
                        type="number"
                        value={String(state.sort_order)}
                        onChange={(v) => setState({ ...state, sort_order: Number(v || 0) })}
                    />
                </L>
                <L label="Is plus-one">
                    <C
                        checked={!!state.is_plus_one}
                        onChange={(b) => setState({ ...state, is_plus_one: b ? 1 : 0 })}
                    />
                </L>
                <L label="Plus-one for (member id)">
                    <I
                        value={state.plus_one_for ?? ""}
                        onChange={(v) => setState({ ...state, plus_one_for: v || null })}
                    />
                </L>
                <L label="Invite ceremony">
                    <C
                        checked={!!state.invite_ceremony}
                        onChange={(b) => setState({ ...state, invite_ceremony: b ? 1 : 0 })}
                    />
                </L>
                <L label="Invite reception">
                    <C
                        checked={!!state.invite_reception}
                        onChange={(b) => setState({ ...state, invite_reception: b ? 1 : 0 })}
                    />
                </L>

                <L label="Attending ceremony">
                    <SelectYN
                        value={state.attending_ceremony}
                        onChange={(v) => setState({ ...state, attending_ceremony: v })}
                    />
                </L>
                <L label="Attending reception">
                    <SelectYN
                        value={state.attending_reception}
                        onChange={(v) => setState({ ...state, attending_reception: v })}
                    />
                </L>
                <L label="Dietary">
                    <I
                        value={state.dietary ?? ""}
                        onChange={(v) => setState({ ...state, dietary: v })}
                    />
                </L>
                <L label="Notes">
                    <I
                        value={state.notes ?? ""}
                        onChange={(v) => setState({ ...state, notes: v })}
                    />
                </L>
            </div>

            <div className="mt-3 flex gap-2">
                <button onClick={save} className="rounded-lg border px-3 py-1">
                    {saving ? "Saving…" : "Save member"}
                </button>
                <button onClick={del} className="rounded-lg border px-3 py-1 bg-[#ffe6e6]">
                    {deleting ? "Deleting…" : "Delete member"}
                </button>
            </div>
        </div>
    );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-ink/70">{label}</div>
            {children}
        </label>
    );
}
type InputStringProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
    value: string;
    onChange: (value: string) => void;
};

function I({ value, onChange, ...rest }: InputStringProps) {
    return (
        <input
            {...rest}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            className="w-full rounded-lg border bg-white px-3 py-2"
        />
    );
}
function C({ checked, onChange }: { checked: boolean; onChange: (b: boolean) => void }) {
    return (
        <input
            type="checkbox"
            className="size-4"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
    );
}
function SelectYN({
    value,
    onChange,
}: {
    value: number | null | undefined;
    onChange: (v: number | null) => void;
}) {
    return (
        <select
            className="w-full rounded-lg border bg-white px-3 py-2"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        >
            <option value="">—</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
        </select>
    );
}
