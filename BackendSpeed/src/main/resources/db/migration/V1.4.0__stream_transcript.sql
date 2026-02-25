-- 1. transcript_stream
CREATE TABLE transcript_stream
(
    id           SERIAL PRIMARY KEY,
    filename     TEXT NOT NULL,
    stream_title TEXT,
    vtuber       TEXT NOT NULL,

    UNIQUE (stream_title, vtuber)
);

-- Partial unique index for (filename, vtuber) when stream_title IS NULL
CREATE UNIQUE INDEX stream_filename_vtuber_unique
    ON transcript_stream (filename, vtuber)
    WHERE stream_title IS NULL;

-- 2. transcript_row
CREATE TABLE transcript_row
(
    id             SERIAL PRIMARY KEY,
    stream_id      INTEGER NOT NULL REFERENCES transcript_stream (id),
    transcript     TEXT    NOT NULL,
    from_timestamp TEXT    NOT NULL,
    to_timestamp   TEXT    NOT NULL
);
