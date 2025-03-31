import { createClient } from "@libsql/client";

// Log database connection details at startup
const logDbConnection = (url: string) => {
  console.log(`[Database] Connected to LibSQL database at ${url}`);
};

// Get environment variables
const dbUrl = process.env.REMOTE_LIBSQL_URL;
const dbToken = process.env.REMOTE_LIBSQL_AUTH_TOKEN;

// Validate configuration
if (!dbUrl) {
  throw new Error("REMOTE_LIBSQL_URL environment variable is required");
}

// Log connection
logDbConnection(dbUrl);

// Create database client
export const db = createClient({
  url: dbUrl,
  authToken: dbToken,
  fetch: globalThis.fetch, // Explicitly use global fetch for better compatibility
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
