-- Lightweight session: no passwords, just a token per user.
-- Token is handed out on first meaningful action, stored in localStorage,
-- and exportable via "Local Save" for recovery.

CREATE TABLE app_session
(
    token        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT        NOT NULL,
    created_at   TIMESTAMP        DEFAULT NOW(),
    last_seen_at TIMESTAMP        DEFAULT NOW()
);

-- Index for lookup by display_name (e.g. checking if name is taken)
CREATE INDEX idx_app_session_display_name ON app_session (display_name);
