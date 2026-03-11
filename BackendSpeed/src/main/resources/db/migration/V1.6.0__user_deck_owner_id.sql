-- Add owner_id column with default random UUID
ALTER TABLE submission_deck ADD COLUMN owner_id UUID DEFAULT gen_random_uuid();

DO
$$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN SELECT DISTINCT username FROM submission_deck
            LOOP
                UPDATE submission_deck
                SET owner_id = gen_random_uuid()
                WHERE username = r.username;
            END LOOP;
    END
$$;

ALTER TABLE submission_deck ALTER COLUMN owner_id SET NOT NULL;
