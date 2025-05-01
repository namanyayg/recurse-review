-- Create recursers table with simplified schema
CREATE TABLE IF NOT EXISTS recursers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profile_picture_url TEXT,
    journey JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
); 