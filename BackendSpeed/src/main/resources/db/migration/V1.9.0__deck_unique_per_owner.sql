UPDATE deck SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE deck ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE deck DROP CONSTRAINT IF EXISTS unique_deck_content;
ALTER TABLE deck ADD CONSTRAINT unique_deck_per_owner UNIQUE (owner_id, deck_name);
ALTER TABLE deck DROP COLUMN username;