import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

type ColumnInfo = {
    name: string;
    type: string;
};

export function createMigrationClient() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl) {
        throw new Error("TURSO_DATABASE_URL is not set.");
    }

    return createClient({
        url: dbUrl,
        authToken: dbToken,
        fetch: globalThis.fetch,
    });
}

export async function tableExists(db: Client, name: string): Promise<boolean> {
    const result = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        args: [name],
    });
    return result.rows.length > 0;
}

export async function getColumn(db: Client, table: string, column: string): Promise<ColumnInfo | undefined> {
    const result = await db.execute(`PRAGMA table_info(${table})`);
    const row = result.rows.find((entry) => entry.name === column);
    if (!row) return undefined;

    return {
        name: String(row.name),
        type: String(row.type),
    };
}

export async function indexExists(db: Client, name: string): Promise<boolean> {
    const result = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
        args: [name],
    });
    return result.rows.length > 0;
}

async function cleanupStagingTable(db: Client) {
    if (await tableExists(db, "user_discord_migration")) {
        await db.execute("DROP TABLE user_discord_migration");
        console.log("Removed leftover user_discord_migration staging table.");
    }
}

export async function applyBaseSchema(db: Client) {
    const migrationsPath = path.join(process.cwd(), "lib", "migrations.sql");
    if (!fs.existsSync(migrationsPath)) {
        throw new Error("lib/migrations.sql not found.");
    }

    const migrations = fs.readFileSync(migrationsPath, "utf8");
    const statements = migrations
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0 && !statement.startsWith("--"));

    console.log("Applying base schema from lib/migrations.sql...");

    for (const statement of statements) {
        await db.execute(`${statement};`);
    }

    if (!(await tableExists(db, "user"))) {
        throw new Error("Base schema migration did not create the user table.");
    }

    console.log("Base schema applied.");
}

export async function applyDiscordSchema(db: Client) {
    await cleanupStagingTable(db);

    const providerColumn = await getColumn(db, "user", "provider");
    if (!providerColumn) {
        console.log("Adding provider column...");
        await db.execute("ALTER TABLE user ADD COLUMN provider TEXT NOT NULL DEFAULT 'github'");
    }

    const discordColumn = await getColumn(db, "user", "discord_id");

    if (!discordColumn) {
        console.log("Adding discord_id column...");
        await db.execute("ALTER TABLE user ADD COLUMN discord_id TEXT");
    } else if (String(discordColumn.type).toUpperCase() !== "TEXT") {
        console.log("Converting discord_id from INTEGER to TEXT...");
        await db.batch([
            { sql: "ALTER TABLE user ADD COLUMN discord_id_text TEXT" },
            {
                sql: "UPDATE user SET discord_id_text = CAST(discord_id AS TEXT) WHERE discord_id IS NOT NULL",
            },
            { sql: "DROP INDEX IF EXISTS user_discord_id_idx" },
            { sql: "ALTER TABLE user DROP COLUMN discord_id" },
            { sql: "ALTER TABLE user RENAME COLUMN discord_id_text TO discord_id" },
        ]);
    }

    if (!(await indexExists(db, "user_discord_id_idx"))) {
        console.log("Creating user_discord_id_idx...");
        await db.execute(
            "CREATE UNIQUE INDEX user_discord_id_idx ON user(discord_id) WHERE discord_id IS NOT NULL"
        );
    }
}

export async function verifySchema(db: Client) {
    const requiredUserColumns = ["id", "github_id", "discord_id", "username", "name", "email", "provider"];
    const requiredSessionColumns = ["id", "expires_at", "user_id"];
    const requiredPostColumns = ["id", "created_at", "message", "user_id", "signature"];

    for (const column of requiredUserColumns) {
        if (!(await getColumn(db, "user", column))) {
            throw new Error(`Missing user.${column} column after migration.`);
        }
    }

    for (const column of requiredSessionColumns) {
        if (!(await getColumn(db, "session", column))) {
            throw new Error(`Missing session.${column} column after migration.`);
        }
    }

    for (const column of requiredPostColumns) {
        if (!(await getColumn(db, "post", column))) {
            throw new Error(`Missing post.${column} column after migration.`);
        }
    }

    const discordColumn = await getColumn(db, "user", "discord_id");
    if (discordColumn && String(discordColumn.type).toUpperCase() !== "TEXT") {
        throw new Error("user.discord_id must be TEXT after migration.");
    }

    if (!(await indexExists(db, "user_discord_id_idx"))) {
        throw new Error("Missing user_discord_id_idx after migration.");
    }
}

export async function runMigrations(db: Client) {
    await applyBaseSchema(db);
    await applyDiscordSchema(db);
    await verifySchema(db);
}

export async function printSchemaSummary(db: Client) {
    for (const table of ["user", "session", "post"]) {
        const info = await db.execute(`PRAGMA table_info(${table})`);
        console.log(`\n${table}:`);
        for (const row of info.rows) {
            console.log(`  - ${row.name} ${row.type}${row.notnull ? " NOT NULL" : ""}`);
        }
    }

    const indexes = await db.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='user' AND name='user_discord_id_idx'"
    );
    for (const row of indexes.rows) {
        console.log(`\nindex ${row.name}: ${row.sql ?? ""}`);
    }
}
