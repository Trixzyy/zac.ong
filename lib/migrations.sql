-- Base schema for zac.ong guestbook (Lucia + Arctic auth)
-- Safe to re-run: uses CREATE TABLE/INDEX IF NOT EXISTS
-- For existing production databases created before Discord auth,
-- run: bun run migrate

CREATE TABLE IF NOT EXISTS user (
    id TEXT NOT NULL PRIMARY KEY,
    github_id INTEGER UNIQUE,
    discord_id TEXT,
    username TEXT NOT NULL,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'github'
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT NOT NULL PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS post (
    id TEXT NOT NULL PRIMARY KEY,
    created_at INTEGER NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT NOT NULL,
    signature TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
