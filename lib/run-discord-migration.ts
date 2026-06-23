import * as dotenv from "dotenv";
import { applyDiscordSchema, createMigrationClient, printSchemaSummary, verifySchema } from "./migrate";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    if (!dbUrl) {
        console.error("Error: TURSO_DATABASE_URL is not set.");
        process.exit(1);
    }

    const db = createMigrationClient();

    console.log(`Running Discord schema migration against ${dbUrl}...`);

    await applyDiscordSchema(db);
    await verifySchema(db);

    console.log("✅ Discord migration completed successfully.");
    await printSchemaSummary(db);
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration failed:", message);
    process.exit(1);
});
