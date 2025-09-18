-- =========================
-- Core tables
-- =========================

-- One row per invite/household (e.g., "David Hoffman Family", "Avery Tucker")
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  can_rsvp INTEGER NOT NULL DEFAULT 1,
  rsvp_deadline DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One row per person tied to a party
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  is_plus_one INTEGER NOT NULL DEFAULT 0,
  plus_one_for TEXT,
  sort_order INTEGER DEFAULT 0,

  invite_ceremony INTEGER NOT NULL DEFAULT 1,
  invite_reception INTEGER NOT NULL DEFAULT 1
);

-- Current attendance snapshot for quick reads (the “latest status”)
CREATE TABLE IF NOT EXISTS member_attendance_current (
  member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  attending_ceremony INTEGER,  -- 0/1/NULL
  attending_reception INTEGER, -- 0/1/NULL
  dietary TEXT                 -- freeform
);

-- Immutable submission history (audit log)
CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id TEXT PRIMARY KEY,
  party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  contact_email TEXT,
  contact_phone TEXT,
  payload_json TEXT NOT NULL
);

-- Idempotency keys to prevent double-submits if users double-click
CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY,
  submission_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Simple rate log (per-IP) to mitigate abuse; optional but handy
CREATE TABLE IF NOT EXISTS rate_log (
  ip TEXT,
  route TEXT,
  ts INTEGER
);

-- =========================
-- Full-text search (FTS5)
-- =========================

-- Search over party display name + concatenated member names
CREATE VIRTUAL TABLE IF NOT EXISTS party_fts USING fts5(
  party_id UNINDEXED,
  display_name,
  members,
  tokenize = 'unicode61'
);

-- Keep FTS in sync with parties/members

CREATE TRIGGER IF NOT EXISTS party_fts_insert AFTER INSERT ON parties BEGIN
  INSERT INTO party_fts (party_id, display_name, members)
  VALUES (NEW.id, NEW.display_name, '');
END;

CREATE TRIGGER IF NOT EXISTS party_fts_update AFTER UPDATE ON parties BEGIN
  UPDATE party_fts SET display_name = NEW.display_name WHERE party_id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS members_after_insert AFTER INSERT ON members BEGIN
  UPDATE party_fts
    SET members = (SELECT GROUP_CONCAT(full_name, ', ') FROM members WHERE party_id = NEW.party_id)
    WHERE party_id = NEW.party_id;
END;

CREATE TRIGGER IF NOT EXISTS members_after_update AFTER UPDATE ON members BEGIN
  UPDATE party_fts
    SET members = (SELECT GROUP_CONCAT(full_name, ', ') FROM members WHERE party_id = NEW.party_id)
    WHERE party_id = NEW.party_id;
END;

CREATE TRIGGER IF NOT EXISTS members_after_delete AFTER DELETE ON members BEGIN
  UPDATE party_fts
    SET members = (SELECT GROUP_CONCAT(full_name, ', ') FROM members WHERE party_id = OLD.party_id)
    WHERE party_id = OLD.party_id;
END;

-- =========================
-- Helpful views (optional)
-- =========================

-- Fast read combining party/member + current attendance + invited events
CREATE VIEW IF NOT EXISTS v_party_members AS
SELECT
  p.id              AS party_id,
  p.display_name    AS party_display_name,
  m.id              AS member_id,
  m.full_name,
  m.is_plus_one,
  m.plus_one_for,
  m.sort_order,
  m.invite_ceremony,
  m.invite_reception,
  a.attending_ceremony,
  a.attending_reception,
  a.dietary
FROM parties p
JOIN members m ON m.party_id = p.id
LEFT JOIN member_attendance_current a ON a.member_id = m.id;

-- =========================
-- Indexes (nice for scale)
-- =========================

CREATE INDEX IF NOT EXISTS idx_members_party ON members(party_id);
CREATE INDEX IF NOT EXISTS idx_members_sort ON members(party_id, sort_order, full_name);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON member_attendance_current(member_id);
CREATE INDEX IF NOT EXISTS idx_rate_log ON rate_log(ip, route, ts);
