import { createClient } from "@libsql/client";

// Log database connection details at startup
const logDbConnection = (url: string) => {
  console.log(`[Database] Connected to Turso database at ${url}`);
};

// Get environment variables
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

// Validate configuration
if (!dbUrl) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}
// Keep token check for security
if (!dbToken) {
  console.warn("[Database] TURSO_AUTH_TOKEN is missing. Database operations might fail.");
}

// Log connection
logDbConnection(dbUrl);

// Create database client - Note: This client might still have migration issues
// The fallback mechanism in guestbook/page.tsx is currently handling queries.
export const db = createClient({
  url: dbUrl,
  authToken: dbToken,
  fetch: globalThis.fetch, // Explicitly use global fetch for better compatibility
  syncUrl: undefined, // Ensure sync is disabled
  syncInterval: 0, // Ensure sync is disabled
});

// Original Turso client configuration (commented out)
// export const db = createClient({
//     url: process.env.TURSO_DATABASE_URL!,
//     authToken: process.env.TURSO_AUTH_TOKEN!,
// });

export interface DatabaseUser {
    id: string;
    username: string;
    github_id: number;
    name?: string;
    email: string;
}
