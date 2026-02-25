ALTER TABLE user_table_state
ADD CONSTRAINT unique_rowid_deckname UNIQUE (rowid, deckname);
