CREATE TABLE submission_deck
(
    id         UUID PRIMARY KEY,
    name       TEXT  NOT NULL,
    properties JSONB NOT NULL,
    cards      JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
