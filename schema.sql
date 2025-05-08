-- Create recursers table with simplified schema
CREATE TABLE IF NOT EXISTS recursers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profile_picture_url TEXT,
    journey TEXT,
    zulip_messages INTEGER,
    zulip_messages_updated_at DATETIME,
    zulip_messages_content TEXT,
    journey_updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS accounts;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS journeys;