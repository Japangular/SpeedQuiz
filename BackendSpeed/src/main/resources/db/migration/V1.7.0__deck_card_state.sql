CREATE TABLE deck_card_state
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deck_id    VARCHAR NOT NULL,
    card_id    VARCHAR NOT NULL,
    owner_id   UUID    NOT NULL,
    state      VARCHAR NOT NULL DEFAULT 'ignored',
    updated_at TIMESTAMP        DEFAULT NOW(),
    UNIQUE (deck_id, card_id, owner_id)
);

-- Migrate existing data from user_table_state
INSERT INTO deck_card_state (deck_id, card_id, owner_id, state)
SELECT deckname,
       rowid,
       gen_random_uuid(),
       'ignored'
FROM user_table_state;
