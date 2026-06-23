import * as dotenv from "dotenv";
import { createMigrationClient, printSchemaSummary, runMigrations } from "./migrate";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    if (!dbUrl) {
        console.error("Error: TURSO_DATABASE_URL is not set.");
        process.exit(1);
    }

    const db = createMigrationClient();

    console.log(`Running migrations against ${dbUrl}...`);

    await runMigrations(db);

    console.log("✅ Migrations completed successfully.");
    await printSchemaSummary(db);
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration failed:", message);
    process.exit(1);
});
