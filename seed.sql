INSERT OR REPLACE INTO parties (id, slug, display_name, contact_email, contact_phone, reminder_opt_in, can_rsvp) VALUES
  ('p_dhoffman', 'david_hoffman_family', 'David Hoffman Family',  NULL, NULL, NULL, 1),
  ('p_avery',    'avery',                 'Avery Tucker',         NULL, NULL, NULL, 1);

INSERT OR REPLACE INTO members (id, party_id, full_name, is_plus_one, plus_one_for, sort_order, invite_ceremony, invite_reception)
VALUES
  ('m_david',   'p_dhoffman', 'David Hoffman',     0, NULL, 1, 1, 1),
  ('m_courtney','p_dhoffman', 'Courtney Hoffman',  0, NULL, 2, 1, 1),
  ('m_matt',    'p_dhoffman', 'Matthew Hoffman',   0, NULL, 3, 1, 0),
  ('m_avery',   'p_avery',    'Avery Tucker',       0, NULL, 1, 1, 1),
  ('m_averyp',  'p_avery',    'Zachary Hoffman',    1, 'Avery Tucker', 2, 1, 1);