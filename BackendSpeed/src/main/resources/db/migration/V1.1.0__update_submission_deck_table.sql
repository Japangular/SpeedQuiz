-- Step 1: Rename the `name` column to `deckName`
ALTER TABLE submission_deck
    RENAME COLUMN name TO deckName;

-- Step 2: Add the `username` column with a default value of 'devUser'
ALTER TABLE submission_deck
    ADD COLUMN username TEXT NOT NULL DEFAULT 'devUser';

-- Step 3: Update existing rows to set `username` to 'devUser'
UPDATE submission_deck
SET username = 'devUser';

-- Optional: Add a comment for the new column for clarity
COMMENT ON COLUMN submission_deck.username IS 'Username of the user who created the deck';
