import * as dotenv from "dotenv";
import { createMigrationClient, runMigrations } from "./migrate";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/**
 * Applies the current schema to the configured Turso database.
 * Uses TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from the environment.
 */
const migrateToRemote = async () => {
    const dbUrl = process.env.TURSO_DATABASE_URL;

    if (!dbUrl) {
        console.error("Error: TURSO_DATABASE_URL is not set.");
        return;
    }

    console.log(`Applying migrations to ${dbUrl}...`);

    try {
        const db = createMigrationClient();
        await db.execute("SELECT 1");
        console.log("Connected to Turso database.");

        await runMigrations(db);

        console.log("Migration completed successfully.");
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error during migration:", message);
    }
};

if (require.main === module) {
    migrateToRemote();
}

export default migrateToRemote;
