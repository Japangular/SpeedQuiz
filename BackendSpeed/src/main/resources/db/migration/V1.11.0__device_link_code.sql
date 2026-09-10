-- Short-lived pairing codes for moving a session token to another device.
--
-- The code itself is never stored: only SHA-256 of the normalised code. A
-- leaked database therefore does not hand out live codes, and the rows are
-- worthless once expired.
--
-- ON DELETE CASCADE: clearing a session should not leave orphaned codes that
-- would resolve to a token nobody owns any more.

CREATE TABLE device_link_code
(
    code_hash   TEXT PRIMARY KEY,
    owner_id    UUID      NOT NULL REFERENCES app_session (token) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL,
    attempts    INT       NOT NULL DEFAULT 0,
    consumed_at TIMESTAMP
);

-- Supports the opportunistic prune on every code creation.
CREATE INDEX idx_device_link_expires ON device_link_code (expires_at);

-- Supports "replace the owner's outstanding code" on re-issue.
CREATE INDEX idx_device_link_owner ON device_link_code (owner_id);
