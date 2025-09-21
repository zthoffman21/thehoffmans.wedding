import { useEffect, useState } from "react";

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
    const [tab, setTab] = useState<"overview" | "submissions" | "missing" | "logs">("overview");
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
                    {["overview", "submissions", "missing"].map((t) => (
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
                                {new Date(s.submitted_at).toLocaleString()}
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
                                    {new Date(r.submitted_at).toLocaleString()}
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
