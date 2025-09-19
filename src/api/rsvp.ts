export type Member = {
  id: string;
  fullName: string;
  isPlusOne?: boolean;
  invitedEvents: string[];               // UI expects this; we’ll default to both events
  attending: Record<string, boolean>;    // { ceremony: true/false, reception: true/false }
  dietary?: string;
  notes?: string;
};

export type Party = {
  id: string;
  displayName: string;
  contact: { email?: string; phone?: string };
  members: Member[];
  reminderOptIn?: boolean;
};

// ---------- Backend DTOs (from your Worker) ----------
type SearchResultDTO = { id: string; label: string };
type SearchResponseDTO = { results: SearchResultDTO[] };

type PartyMemberDTO = {
  id: string;
  full_name: string;
  is_plus_one: 0 | 1;
  plus_one_for?: string | null;
  sort_order: number;
  attending_ceremony: 0 | 1 | null;
  attending_reception: 0 | 1 | null;
  dietary?: string | null;
};

type PartyDTO = {
  id: string;
  display_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  reminder_opt_in?: 0 | 1 | null; 
};

type GetPartyResponseDTO = {
  party: PartyDTO;
  members: PartyMemberDTO[];
};

// ---------- Mapping helpers ----------
function mapMember(dto: PartyMemberDTO): Member {
  // If you later add "invited events" to the DB, map them here.
  // For now, default to both ceremony & reception.
  const invitedEvents = ["ceremony", "reception"];

  return {
    id: dto.id,
    fullName: dto.full_name,
    isPlusOne: dto.is_plus_one === 1,
    invitedEvents,
    attending: {
      ceremony: dto.attending_ceremony === 1,
      reception: dto.attending_reception === 1,
    },
    dietary: dto.dietary ?? undefined,
  };
}

function mapParty(dto: PartyDTO, members: PartyMemberDTO[]): Party {
  return {
    id: dto.id,
    displayName: dto.display_name,
    contact: { email: dto.contact_email ?? undefined, phone: dto.contact_phone ?? undefined },
    members: members.map(mapMember),
    reminderOptIn: dto.reminder_opt_in === 1,
  };
}

// ---------- Public API you’ll import in the page ----------
export async function searchParties(q: string): Promise<Array<{ id: string; label: string }>> {
  const r = await fetch(`/api/party/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error("search failed");
  const data = (await r.json()) as SearchResponseDTO;
  return data.results;
}

export async function getPartyById(id: string): Promise<Party | null> {
  const r = await fetch(`/api/party/${id}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("load party failed");
  const data = (await r.json()) as GetPartyResponseDTO;
  return mapParty(data.party, data.members);
}

export type RSVPPost = {
  contact?: { email?: string; phone?: string };
  members: {
    memberId: string;
    attending: { ceremony: boolean | null; reception: boolean | null };
    dietary?: string;
  }[];
  notes?: string;
  reminderOptIn?: boolean;
};

export async function submitRSVP(partyId: string, payload: RSVPPost): Promise<{ ok: boolean; submissionId: string }> {
  const r = await fetch(`/api/party/${partyId}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("submit failed");
  return (await r.json()) as { ok: boolean; submissionId: string };
}
