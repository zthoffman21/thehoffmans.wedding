-- Parties (households / individuals)
INSERT OR REPLACE INTO parties (id, display_name, contact_email, contact_phone, can_rsvp)
VALUES
  ('p_dhoffman', 'David Hoffman Family', 'david@example.com', '610-555-1299', 1),
  ('p_avery',    'Avery Smith',          'avery@example.com', NULL,            1);

-- Members (people on each invite)
-- invite_ceremony / invite_reception: 1=yes, 0=no
INSERT OR REPLACE INTO members (id, party_id, full_name, is_plus_one, plus_one_for, sort_order, invite_ceremony, invite_reception)
VALUES
  ('m_david',   'p_dhoffman', 'David Hoffman',     0, NULL, 1, 1, 1),
  ('m_courtney','p_dhoffman', 'Courtney Hoffman',  0, NULL, 2, 1, 1),
  ('m_matt',    'p_dhoffman', 'Matthew Hoffman',   0, NULL, 3, 1, 0),
  ('m_avery',   'p_avery',    'Avery Smith',       0, NULL, 1, 1, 1),
  ('m_averyp',  'p_avery',    'Known Plus One',    1, 'Avery Smith', 2, 1, 1);

-- Optional: start everyone as "no selection yet" (NULL) in the current table.
-- (If a row already exists for a member, this won't overwrite it.)
INSERT OR IGNORE INTO member_attendance_current (member_id, attending_ceremony, attending_reception, dietary)
SELECT id, NULL, NULL, NULL FROM members;

-- Rebuild party_fts "members" column (concatenated names)
UPDATE party_fts SET members = (
  SELECT GROUP_CONCAT(full_name, ', ')
  FROM members
  WHERE party_id = party_fts.party_id
);
