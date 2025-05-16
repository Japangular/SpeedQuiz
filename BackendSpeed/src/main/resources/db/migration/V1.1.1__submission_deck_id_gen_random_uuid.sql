ALTER TABLE submission_deck ALTER COLUMN id SET DEFAULT gen_random_uuid();
CREATE EXTENSION IF NOT EXISTS pgcrypto;
