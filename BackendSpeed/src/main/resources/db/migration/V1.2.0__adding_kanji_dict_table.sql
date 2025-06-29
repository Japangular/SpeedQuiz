CREATE TABLE kanji
(
    id       SERIAL PRIMARY KEY,
    kanji    CHAR(1) UNIQUE NOT NULL,
    onyomi   TEXT[],
    kunyomi  TEXT[],
    meanings TEXT[],
    tags     TEXT[], -- e.g. ['jouyou', 'frequent']
    metadata JSONB   -- store fields like stroke count, heisig index, frequency, etc.
);
