import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const runDiscordMigration = async () => {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl) {
        console.error("Error: TURSO_DATABASE_URL is not set.");
        process.exit(1);
    }

    const db = createClient({
        url: dbUrl,
        authToken: dbToken,
        fetch: globalThis.fetch,
    });

    console.log(`Running Discord migration against ${dbUrl}...`);

    await cleanupStagingTable(db);

    const discordColumn = await getColumn(db, "user", "discord_id");

    if (!discordColumn) {
        console.log("Adding discord_id and provider columns...");
        await db.execute("ALTER TABLE user ADD COLUMN discord_id TEXT");
        await db.execute("ALTER TABLE user ADD COLUMN provider TEXT NOT NULL DEFAULT 'github'");
        await db.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS user_discord_id_idx ON user(discord_id) WHERE discord_id IS NOT NULL"
        );
        console.log("✅ Discord migration completed successfully.");
        return;
    }

    if (String(discordColumn.type).toUpperCase() === "TEXT") {
        console.log("discord_id is already TEXT — migration not needed.");
        return;
    }

    console.log("Converting discord_id from INTEGER to TEXT...");
    await db.batch([
        { sql: "ALTER TABLE user ADD COLUMN discord_id_text TEXT" },
        {
            sql: "UPDATE user SET discord_id_text = CAST(discord_id AS TEXT) WHERE discord_id IS NOT NULL",
        },
        { sql: "DROP INDEX IF EXISTS user_discord_id_idx" },
        { sql: "ALTER TABLE user DROP COLUMN discord_id" },
        { sql: "ALTER TABLE user RENAME COLUMN discord_id_text TO discord_id" },
        {
            sql: "CREATE UNIQUE INDEX IF NOT EXISTS user_discord_id_idx ON user(discord_id) WHERE discord_id IS NOT NULL",
        },
    ]);

    console.log("✅ discord_id converted to TEXT successfully.");
};

async function tableExists(db: ReturnType<typeof createClient>, name: string): Promise<boolean> {
    const result = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        args: [name],
    });
    return result.rows.length > 0;
}

async function getColumn(db: ReturnType<typeof createClient>, table: string, column: string) {
    const result = await db.execute(`PRAGMA table_info(${table})`);
    return result.rows.find((row) => row.name === column);
}

async function cleanupStagingTable(db: ReturnType<typeof createClient>) {
    if (await tableExists(db, "user_discord_migration")) {
        await db.execute("DROP TABLE user_discord_migration");
        console.log("Removed leftover user_discord_migration staging table.");
    }
}

runDiscordMigration().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration failed:", message);
    process.exit(1);
});
