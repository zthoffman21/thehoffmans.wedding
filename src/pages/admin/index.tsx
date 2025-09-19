import { useEffect, useState } from "react";

type Submission = {
  id: string; party_id: string; member_id?: string | null;
  party_name?: string | null; member_name?: string | null;
  payload_json?: string | null; submitted_at: string;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"overview"|"submissions"|"missing"|"logs">("overview");
  return (
    <section className="mx-auto max-w-6xl p-6 text-ink">
      <h1 className="mb-6 text-3xl font-semibold">Admin Dashboard</h1>
      <nav className="mb-6 flex gap-2">
        {["overview","submissions","missing","logs"].map((t) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`rounded-xl border px-3 py-1 ${tab===t ? "bg-ink text-white" : "bg-white"}`}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
        <a className="ml-auto rounded-xl border px-3 py-1" href="/api/admin/export.csv?scope=submissions">
          Export CSV
        </a>
      </nav>
      {tab==="overview" && <Overview/>}
      {tab==="submissions" && <Submissions/>}
      {tab==="missing" && <Missing/>}
    </section>
  );
}

function Overview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/overview").then(r=>r.json()).then(setData); }, []);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Parties", value: data?.counts?.parties ?? "—" },
          { label: "Members", value: data?.counts?.members ?? "—" },
          { label: "Submissions", value: data?.counts?.submissions ?? "—" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-ink/60">{c.label}</div>
            <div className="text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Recent Submissions (7 days)</h2>
        <ul className="divide-y">
          {(data?.recentSubmissions ?? []).map((s: any) => (
            <li key={s.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.party_name ?? s.party_id}</div>
              </div>
              <div className="text-sm text-ink/60">{new Date(s.submitted_at).toLocaleString()}</div>
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
  const [items, setItems] = useState<Submission[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (cursor?: string | null) => {
    setLoading(true);
    const url = new URL("/api/admin/submissions", location.origin);
    url.searchParams.set("limit","25");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url).then(r=>r.json());
    setItems(prev => cursor ? [...prev, ...res.items] : res.items);
    setNext(res.nextCursor ?? null);
    setLoading(false);
  };
  useEffect(()=>{ load(null); },[]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Submissions</h2>
      <ul className="divide-y">
        {items.map((s) => (
          <li key={s.id} className="py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.party_name ?? s.party_id}</div>
                <div className="text-sm text-ink/60 truncate">{s.member_name ?? "—"}</div>
                {s.payload_json && (
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs">
                    {s.payload_json}
                  </pre>
                )}
              </div>
              <div className="shrink-0 text-sm text-ink/60">{new Date(s.submitted_at).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        {next ? (
          <button className="rounded-lg border px-3 py-1" disabled={loading} onClick={()=>load(next)}>
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : <span className="text-sm text-ink/60">No more results.</span>}
      </div>
    </div>
  );
}

function Missing() {
  const [data, setData] = useState<{ membersNoRSVP: any[]; partiesNoRSVP: any[] }>();
  useEffect(()=>{ fetch("/api/admin/missing").then(r=>r.json()).then(setData); },[]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Members w/ no RSVP</h2>
        <ul className="max-h-[28rem] divide-y overflow-auto">
          {(data?.membersNoRSVP ?? []).map((m) => (
            <li key={m.member_id} className="py-2">
              <div className="font-medium">{m.full_name}</div>
              <div className="text-sm text-ink/60">{m.display_name}</div>
            </li>
          ))}
          {(!data?.membersNoRSVP || data.membersNoRSVP.length === 0) && (
            <div className="py-4 text-sm text-ink/60">Great! Everyone has responded.</div>
          )}
        </ul>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Parties w/ no RSVP</h2>
        <ul className="max-h-[28rem] divide-y overflow-auto">
          {(data?.partiesNoRSVP ?? []).map((p) => (
            <li key={p.id} className="py-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.display_name}</div>
                  <div className="text-sm text-ink/60">{p.member_count} members</div>
                </div>
              </div>
            </li>
          ))}
          {(!data?.partiesNoRSVP || data.partiesNoRSVP.length === 0) && (
            <div className="py-4 text-sm text-ink/60">All parties have at least one submission.</div>
          )}
        </ul>
      </div>
    </div>
  );
}