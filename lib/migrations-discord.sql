-- Discord OAuth schema migration (run via: npm run migrate-discord)
-- discord_id must be TEXT — Discord snowflakes exceed JS Number.MAX_SAFE_INTEGER.

ALTER TABLE user ADD COLUMN discord_id INTEGER;
ALTER TABLE user ADD COLUMN provider TEXT NOT NULL DEFAULT 'github';
CREATE UNIQUE INDEX IF NOT EXISTS user_discord_id_idx ON user(discord_id) WHERE discord_id IS NOT NULL;

-- Convert discord_id from INTEGER to TEXT (safe to re-run: skips if already TEXT)
ALTER TABLE user ADD COLUMN discord_id_text TEXT;
UPDATE user SET discord_id_text = CAST(discord_id AS TEXT) WHERE discord_id IS NOT NULL;
DROP INDEX IF EXISTS user_discord_id_idx;
ALTER TABLE user DROP COLUMN discord_id;
ALTER TABLE user RENAME COLUMN discord_id_text TO discord_id;
CREATE UNIQUE INDEX IF NOT EXISTS user_discord_id_idx ON user(discord_id) WHERE discord_id IS NOT NULL;
