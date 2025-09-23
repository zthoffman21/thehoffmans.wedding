import { useEffect, useState, useRef } from "react";
import { searchParties as apiSearchParties } from "../../api/rsvp";
import { formatNYDateTime } from "../../lib/time";

/* =========================================================================
   Types shared by tabs
   ========================================================================= */

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

/* =========================================================================
   NEW: Admin gallery types + tiny helpers
   ========================================================================= */

type AdminPhoto = {
    id: string; // R2 key (same as photos.id)
    caption?: string | null;
    display_name?: string | null;
    width?: number | null;
    height?: number | null;
    created_at: string;
};

// lightweight fetch-as-json with error surfacing
async function asJson<T>(res: Response): Promise<T> {
    const body = await res.json().catch(() => ({}));
    if (!res.ok || (body && (body as any).ok === false)) {
        const msg =
            (body as any)?.message || (body as any)?.error || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return body as T;
}

// admin endpoints we added on the server
export async function getSettings() {
    const res = await fetch(`/api/admin/settings`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
    });
    const data = await asJson<{
        ok: true;
        settings: {
            auto_publish_uploads: boolean;
            upload_rate_per_hour: number;
            purge_rejected_uploads: boolean;
        };
    }>(res);
    return data.settings;
}
async function listAdminPhotos(status = "pending", limit = 100) {
    const res = await fetch(
        `/api/admin/photos?status=${encodeURIComponent(status)}&limit=${limit}`,
        {
            headers: { Accept: "application/json" },
            cache: "no-store",
        }
    );
    return asJson<{ ok: true; items: AdminPhoto[] }>(res);
}
async function approvePhoto(id: string) {
    const res = await fetch(`/api/admin/photos/${encodeURIComponent(id)}/approve`, {
        method: "POST",
    });
    return asJson<{ ok: true }>(res);
}
async function rejectPhoto(id: string) {
    const res = await fetch(`/api/admin/photos/${encodeURIComponent(id)}/reject`, {
        method: "POST",
    });
    return asJson<{ ok: true }>(res);
}
async function updateGallerySettings(opts: {
    auto_publish_uploads?: boolean;
    upload_rate_per_hour?: number;
    purge_rejected_uploads?: boolean;
}) {
    const res = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
    });
    return asJson<{ ok: true; updated: Record<string, string> }>(res);
}

async function deletePhoto(id: string) {
    const res = await fetch(`/api/admin/photos/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });
    return asJson<{ ok: true }>(res);
}

/* =========================================================================
   Image URL helper for previews
   ========================================================================= */

const IMG_ORIGIN = import.meta.env.VITE_IMG_PUBLIC_ORIGIN;
function cfImg(key: string, w: number, q = 75) {
    return `/cdn-cgi/image/width=${w},quality=${q},format=auto/${IMG_ORIGIN}/${encodeURI(key)}`;
}

/* =========================================================================
   Admin Dashboard (now with "Gallery" tab)
   ========================================================================= */

export default function AdminDashboard() {
    const [tab, setTab] = useState<"overview" | "submissions" | "missing" | "manage" | "gallery">(
        "overview"
    );

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

                <nav
                    className="mb-6 flex gap-2 overflow-x-auto whitespace-nowrap -mx-4 px-4
             [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {["overview", "submissions", "missing", "manage", "gallery"].map((t) => (
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
                {tab === "gallery" && <GalleryTab />}
            </section>
        </section>
    );
}

/* =========================================================================
   Overview
   ========================================================================= */

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

/* =========================================================================
   Submissions
   ========================================================================= */

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

/* =========================================================================
   Missing
   ========================================================================= */

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

/* =========================================================================
   Manage
   ========================================================================= */

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
                        placeholder="Enter party name…"
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

            {/* Right: editor */}
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
        await fetch(`/api/admin/member`, {
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

/* =========================================================================
   Gallery moderation tab (queue + settings)
   ========================================================================= */

function GalleryTab() {
    type Mode = "pending" | "posted";

    const [mode, setMode] = useState<Mode>("pending");

    // pending queue
    const [queue, setQueue] = useState<AdminPhoto[]>([]);
    // posted list
    const [posted, setPosted] = useState<AdminPhoto[]>([]);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // settings local UI state (defaults match schema seeds)
    const [autoPublish, setAutoPublish] = useState(false);
    const [ratePerHour, setRatePerHour] = useState<number>(20);
    const [saving, setSaving] = useState(false);
    const [purgeRejected, setPurgeRejected] = useState(true);

    const [preview, setPreview] = useState<AdminPhoto | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());

    function clearSelection() {
        setSelected(new Set());
    }
    function toggleOne(id: string, checked: boolean) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }
    function toggleAll(checked: boolean) {
        if (checked) setSelected(new Set(posted.map((p) => p.id)));
        else clearSelection();
    }

    useEffect(() => {
        clearSelection();
    }, [posted.length]);

    async function onBulkDelete() {
        if (selected.size === 0) return;

        const msg =
            selected.size === 1
                ? "Delete this selected image? This cannot be undone."
                : `Delete ${selected.size} selected images? This cannot be undone.`;
        if (!confirm(msg)) return;

        setLoading(true);
        try {
            const ids = Array.from(selected);
            const results = await Promise.allSettled(ids.map((id) => deletePhoto(id)));
            const okCount = results.filter((r) => r.status === "fulfilled").length;
            const failCount = results.length - okCount;

            const okIds = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
            setPosted((p) => p.filter((x) => !okIds.has(x.id)));
            clearSelection();

            if (failCount > 0) {
                alert(`Deleted ${okCount} image(s). ${failCount} failed.`);
            } else {
                alert(`Deleted ${okCount} image(s).`);
            }
        } finally {
            setLoading(false);
        }
    }

    async function refreshPending() {
        const res = await listAdminPhotos("pending", 200);
        setQueue(res.items || []);
    }
    async function refreshPosted() {
        // server returns only approved/public items for 'approved'
        const res = await listAdminPhotos("approved", 200);
        setPosted(res.items || []);
    }
    async function refreshActive() {
        setErr(null);
        setLoading(true);
        try {
            if (mode === "pending") await refreshPending();
            else await refreshPosted();
            clearSelection();
        } catch (e: any) {
            setErr(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getSettings()
            .then((s) => {
                setAutoPublish(!!s.auto_publish_uploads);
                setRatePerHour(Number(s.upload_rate_per_hour || 20));
                setPurgeRejected(!!s.purge_rejected_uploads);
            })
            .catch((e) => console.error("Failed to load settings", e));
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setPreview(null);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // load both lists once on mount so tab switch is instant
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await Promise.all([refreshPending(), refreshPosted()]);
            } catch (e: any) {
                setErr(e?.message || String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // actions
    async function onApprove(id: string) {
        try {
            await approvePhoto(id);
            // move from pending -> posted in UI
            const item = queue.find((x) => x.id === id);
            setQueue((q) => q.filter((x) => x.id !== id));
            if (item) setPosted((p) => [{ ...item }, ...p]);
        } catch (e: any) {
            alert(e?.message || "Approve failed");
        }
    }
    async function onReject(id: string) {
        try {
            await rejectPhoto(id);
            setQueue((q) => q.filter((x) => x.id !== id));
        } catch (e: any) {
            alert(e?.message || "Reject failed");
        }
    }
    async function onDelete(id: string) {
        if (!confirm("Delete this posted image? This cannot be undone.")) return;
        try {
            await deletePhoto(id);
            setPosted((p) => p.filter((x) => x.id !== id));
            setSelected((prev) => {
                if (!prev.has(id)) return prev;
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (e: any) {
            alert(e?.message || "Delete failed");
        }
    }

    function useIndeterminate(allCount: number, selectedCount: number) {
        const ref = useRef<HTMLInputElement>(null);
        useEffect(() => {
            if (!ref.current) return;
            ref.current.indeterminate = selectedCount > 0 && selectedCount < allCount;
        }, [allCount, selectedCount]);
        return ref;
    }

    async function onSaveSettings() {
        try {
            setSaving(true);
            await updateGallerySettings({
                auto_publish_uploads: autoPublish,
                upload_rate_per_hour: Math.max(1, Number(ratePerHour || 20)),
                purge_rejected_uploads: !!purgeRejected,
            });
            alert("Settings saved");
        } catch (e: any) {
            alert(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Settings card */}
            <div className="gap-4 sm:grid-cols-3 rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                {/* Settings card */}
                <div className="rounded-2xl border bg-[#FAF7EC] p-4 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-start">
                        {/* Left: settings */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="size-4"
                                    checked={autoPublish}
                                    onChange={(e) => setAutoPublish(e.target.checked)}
                                />
                                <span className="text-sm">
                                    Auto-publish uploads (skip approval)
                                </span>
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="size-4"
                                    checked={purgeRejected}
                                    onChange={(e) => setPurgeRejected(e.target.checked)}
                                />
                                <span className="text-sm">Purge rejected uploads from R2</span>
                            </label>

                            <div className="flex items-center gap-3">
                                <label className="text-sm">Upload rate / hour</label>
                                <input
                                    type="number"
                                    className="w-28 rounded border p-1"
                                    value={ratePerHour}
                                    min={1}
                                    onChange={(e) => setRatePerHour(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Right: action (auto width, sticks to right) */}
                        <div className="flex sm:justify-end">
                            <button
                                onClick={onSaveSettings}
                                disabled={saving}
                                className="rounded-xl bg-ink/90 px-3 py-2 text-ink disabled:opacity-50"
                            >
                                {saving ? "Saving…" : "Save settings"}
                            </button>
                        </div>

                        {/* Full-width note */}
                        <p className="sm:col-span-2 text-xs text-ink/60">
                            When auto-publish is off, new photos are saved as <em>pending</em> and
                            hidden until approved via this queue.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mode switcher + actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-xl border overflow-hidden">
                    <button
                        className={`px-3 py-1 text-sm ${
                            mode === "pending" ? "bg-ink text-[#FAF7EC]" : "bg-[#FAF7EC]"
                        }`}
                        onClick={() => setMode("pending")}
                    >
                        Pending ({queue.length})
                    </button>
                    <button
                        className={`px-3 py-1 text-sm border-l ${
                            mode === "posted" ? "bg-ink text-[#FAF7EC]" : "bg-[#FAF7EC]"
                        }`}
                        onClick={() => setMode("posted")}
                    >
                        Posted ({posted.length})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {mode === "posted" && posted.length > 0 && (
                        <>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm"
                                onClick={() => toggleAll(true)}
                                disabled={selected.size === posted.length}
                                title="Select all"
                            >
                                Select all
                            </button>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm"
                                onClick={clearSelection}
                                disabled={selected.size === 0}
                                title="Clear selection"
                            >
                                Clear
                            </button>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm bg-[#ffe6e6]"
                                onClick={onBulkDelete}
                                disabled={selected.size === 0}
                                title="Delete selected"
                            >
                                Delete selected ({selected.size})
                            </button>
                        </>
                    )}

                    <button
                        onClick={refreshActive}
                        className="rounded-lg border px-3 py-1 text-sm"
                        title="Refresh"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {err && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
                    {err}
                </div>
            )}

            {/* Views */}
            {loading ? (
                <p>Loading…</p>
            ) : mode === "pending" ? (
                queue.length === 0 ? (
                    <p className="text-ink/60">No pending uploads.</p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {queue.map((p) => (
                            <li key={p.id} className="rounded-2xl border bg-white p-3">
                                <figure className="mb-2">
                                    <img
                                        className="w-full rounded-xl bg-neutral-200 object-cover"
                                        src={cfImg(p.id, 900)}
                                        srcSet={`
                      ${cfImg(p.id, 480, 70)} 480w,
                      ${cfImg(p.id, 900, 75)} 900w,
                      ${cfImg(p.id, 1400, 75)} 1400w
                    `}
                                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                                        alt={p.caption || "Pending photo"}
                                        style={
                                            p.width && p.height
                                                ? { aspectRatio: `${p.width} / ${p.height}` }
                                                : undefined
                                        }
                                        loading="lazy"
                                    />
                                    {(p.caption || p.display_name) && (
                                        <figcaption className="mt-1 text-xs text-ink/70">
                                            {p.caption}{" "}
                                            {p.display_name ? `— ${p.display_name}` : ""}
                                        </figcaption>
                                    )}
                                </figure>

                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => onReject(p.id)}
                                        className="rounded-lg border px-3 py-1 text-sm"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => onApprove(p.id)}
                                        className="rounded-lg bg-ink/90 px-3 py-1 text-sm text-ink"
                                    >
                                        Approve
                                    </button>
                                </div>

                                <p className="mt-2 text-[11px] text-ink/50">
                                    Uploaded: {formatNYDateTime(p.created_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )
            ) : posted.length === 0 ? (
                <p className="text-ink/60">No posted images yet.</p>
            ) : (
                <div className="overflow-auto rounded-lg border bg-[#FAF7EC]">
                    <table className="min-w-[760px] w-full text-sm">
                        <thead className="bg-[#d6d4ca] text-ink/80">
                            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                                {/* NEW: select col */}
                                <th className="w-[42px]">
                                    {(() => {
                                        const ref = useIndeterminate(posted.length, selected.size);
                                        const allChecked =
                                            posted.length > 0 && selected.size === posted.length;
                                        return (
                                            <input
                                                ref={ref}
                                                type="checkbox"
                                                className="size-4"
                                                checked={allChecked}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                                aria-label="Select all"
                                            />
                                        );
                                    })()}
                                </th>
                                <th>Posted</th>
                                <th>By</th>
                                <th>Caption</th>
                                <th className="w-[220px] text-right pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2 divide-y">
                            {posted.map((p) => {
                                const isChecked = selected.has(p.id);
                                return (
                                    <tr
                                        key={p.id}
                                        className={isChecked ? "bg-[#efece0]" : undefined}
                                    >
                                        {/* NEW: row checkbox */}
                                        <td className="align-middle">
                                            <input
                                                type="checkbox"
                                                className="size-4"
                                                checked={isChecked}
                                                onChange={(e) => toggleOne(p.id, e.target.checked)}
                                                aria-label="Select row"
                                            />
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {formatNYDateTime(p.created_at)}
                                        </td>
                                        <td
                                            className="max-w-[220px] truncate"
                                            title={p.display_name ?? ""}
                                        >
                                            {p.display_name || "—"}
                                        </td>
                                        <td
                                            className="max-w-[360px] truncate"
                                            title={p.caption ?? ""}
                                        >
                                            {p.caption || "—"}
                                        </td>
                                        <td className="text-right">
                                            <div className="inline-flex gap-2">
                                                <button
                                                    className="rounded-lg border px-3 py-1"
                                                    onClick={() => setPreview(p)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="rounded-lg border px-3 py-1 bg-[#ffe6e6]"
                                                    onClick={() => onDelete(p.id)}
                                                    title="Delete image"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-8 text-xs text-ink/60">
                The public gallery endpoint only returns <code>status='approved'</code> with{" "}
                <code>is_public=1</code>, so pending items never appear until approved.
            </p>

            {/* Image preview modal */}
            {preview && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setPreview(null)}
                >
                    <div
                        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-[#FAF7EC] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                            <div className="min-w-0">
                                <div className="truncate font-medium">
                                    {preview.caption || "Photo"}
                                </div>
                                <div className="truncate text-xs text-ink/60">
                                    {preview.display_name ? `${preview.display_name} • ` : ""}
                                    {formatNYDateTime(preview.created_at)}
                                </div>
                            </div>
                            <button
                                className="rounded-lg border px-3 py-1"
                                onClick={() => setPreview(null)}
                            >
                                Close
                            </button>
                        </div>

                        {/* Image */}
                        <div className="max-h-[80vh] overflow-auto bg-neutral-100">
                            <img
                                src={cfImg(preview.id, 1600, 85)}
                                srcSet={`
            ${cfImg(preview.id, 800, 80)} 800w,
            ${cfImg(preview.id, 1200, 85)} 1200w,
            ${cfImg(preview.id, 2000, 85)} 2000w
          `}
                                sizes="(max-width: 640px) 95vw, 80vw"
                                alt={preview.caption || "Photo"}
                                className="mx-auto block h-auto w-full max-w-none"
                                style={
                                    preview.width && preview.height
                                        ? { aspectRatio: `${preview.width} / ${preview.height}` }
                                        : undefined
                                }
                            />
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-2">
                            <a
                                className="rounded-lg border px-3 py-1"
                                href={cfImg(preview.id, 2000, 90)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open in new tab
                            </a>
                            <button
                                className="rounded-lg border px-3 py-1 bg-[#ffe6e6]"
                                onClick={() => {
                                    setPreview(null);
                                    onDelete(preview.id);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   Small UI primitives
   ========================================================================= */

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
