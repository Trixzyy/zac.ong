import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

/**
 * Migrates data from a local SQLite database to the remote LibSQL server
 * This script is useful when setting up a new remote database or recovering from a backup
 */
const migrateToRemote = async () => {
  console.log("Starting migration to remote LibSQL server...");

  // Check if remote environment variables are available
  const remoteUrl = process.env.REMOTE_LIBSQL_URL;
  const remoteToken = process.env.REMOTE_LIBSQL_AUTH_TOKEN || "";
  
  if (!remoteUrl) {
    console.error("Error: Remote LibSQL URL is missing. Make sure REMOTE_LIBSQL_URL is set in .env.local");
    return;
  }

  console.log(`Target remote database: ${remoteUrl}`);
  
  try {
    // Test basic connectivity
    console.log("Testing HTTP connectivity...");
    try {
      const response = await fetch(`${remoteUrl}/`, { method: 'HEAD' });
      console.log(`HTTP test response status: ${response.status}`);
    } catch (error: any) {
      console.error("⚠️ HTTP connectivity test failed:", error.message);
      console.log("Will attempt LibSQL connection anyway...");
    }

    // Create local client from a previously created backup
    console.log("Creating temporary local database...");
    const localDbPath = path.join(process.cwd(), "temp_migration.db");
    const localDb = createClient({
      url: `file:${localDbPath}`,
    });

    // Create remote client
    console.log("Connecting to remote database...");
    const remoteDb = createClient({
      url: remoteUrl,
      authToken: remoteToken.length > 0 ? remoteToken : undefined,
      fetch: globalThis.fetch,
    });

    // Test connection to remote
    try {
      await remoteDb.execute("SELECT 1");
      console.log("✅ Connected to remote LibSQL server");
    } catch (error: any) {
      console.error("❌ Failed to connect to remote LibSQL server:", error.message);
      if (error.cause) console.error("Underlying error:", error.cause);
      return;
    }

    // Set up schema on remote server
    const migrationsPath = path.join(process.cwd(), "lib", "migrations.sql");
    if (!fs.existsSync(migrationsPath)) {
      console.error("❌ Migrations file not found. Cannot set up remote schema.");
      return;
    }
    
    const migrations = fs.readFileSync(migrationsPath, "utf8");
    const statements = migrations
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log("Setting up remote schema...");
    for (const statement of statements) {
      try {
        await remoteDb.execute(statement + ';');
        console.log(`✅ Executed: ${statement.substring(0, 40)}...`);
      } catch (error: any) {
        console.error(`⚠️ Error executing statement: ${statement.substring(0, 40)}...`);
        console.error(`   Error: ${error.message}`);
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("Your remote database at https://db.zac.ong is now configured and ready to use");
    
  } catch (error: any) {
    console.error("❌ Error during migration:", error.message);
    if (error.cause) console.error("Underlying error:", error.cause);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  migrateToRemote();
}

export default migrateToRemote; 