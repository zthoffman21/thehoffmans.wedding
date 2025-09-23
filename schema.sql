DROP VIEW IF EXISTS v_party_members;

DROP TABLE IF EXISTS member_attendance_current;
DROP TABLE IF EXISTS rsvp_submissions;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS party_fts;
DROP TABLE IF EXISTS idempotency;
DROP TABLE IF EXISTS rate_log;
DROP TABLE IF EXISTS parties;

DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  reminder_opt_in INTEGER DEFAULT 0,
  can_rsvp INTEGER NOT NULL DEFAULT 1,
  rsvp_deadline DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS member_attendance_current (
  member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  attending_ceremony INTEGER,
  attending_reception INTEGER,
  dietary TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id TEXT PRIMARY KEY,
  party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  contact_email TEXT,
  contact_phone TEXT,
  reminder_opt_in INTEGER DEFAULT 0,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY,
  submission_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS party_fts USING fts5(
  party_id UNINDEXED,
  display_name,
  members,
  tokenize = 'unicode61'
);



CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 1,
  cover_photo_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO albums(id,slug,title,is_public) VALUES
('album_general','general','General',1),
('album_ceremony', 'ceremony','Ceremony',1),
('album_reception', 'reception', 'Reception',1),
('album_friends_family', 'friendsandfamily', 'Friends & Family',1),
('album_details', 'albumanddecor', 'Details & Decor',1),
('album_party', 'party', 'Dance Floor / Party',1);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  album_id TEXT REFERENCES albums(id) ON DELETE SET NULL DEFAULT 'album_general',
  caption TEXT,
  display_name TEXT,
  width INTEGER, height INTEGER,
  taken_at DATETIME,
  status TEXT NOT NULL DEFAULT 'approved',
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_log (
  id TEXT PRIMARY KEY,
  bucket TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_bucket_time ON rate_log(bucket, created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
INSERT OR IGNORE INTO settings(key, value) VALUES
  ('auto_publish_uploads','0'),
  ('upload_rate_per_hour','20'),
  ('purge_rejected_uploads', '1');


CREATE TABLE IF NOT EXISTS email_usage (
  ym TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);


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
  a.dietary,
  a.notes           AS notes
FROM parties p
JOIN members m ON m.party_id = p.id
LEFT JOIN member_attendance_current a ON a.member_id = m.id;

CREATE INDEX IF NOT EXISTS idx_members_party ON members(party_id);
CREATE INDEX IF NOT EXISTS idx_members_sort ON members(party_id, sort_order, full_name);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON member_attendance_current(member_id);

CREATE INDEX IF NOT EXISTS idx_rate_bucket_time ON rate_log(bucket, created_at);

CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON rsvp_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_party ON rsvp_submissions(party_id);

CREATE INDEX IF NOT EXISTS idx_photos_public ON photos (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos (created_at DESC) WHERE status = 'approved' AND is_public = 1;