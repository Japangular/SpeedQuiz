-- Rename table
ALTER TABLE submission_deck RENAME TO deck;

-- Rename column to follow snake_case convention
ALTER TABLE deck RENAME COLUMN deckName TO deck_name;

-- The unique index references the old column name, so recreate it
DROP INDEX IF EXISTS unique_deck_content;
CREATE UNIQUE INDEX unique_deck_content ON deck (deck_name, properties, cards);