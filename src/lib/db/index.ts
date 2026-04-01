import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.local.example)"
  );
}

// postgres-js client with prepare: false for Supabase pooler (port 6543)
const client = postgres(DATABASE_URL, { prepare: false });

// Module-level singleton -- survives hot reload in dev
const db = drizzle(client, { schema, logger: true });

export function getDb() {
  return db;
}

// Direct connection (port 5432, no pooler) for writes that don't persist through transaction pooler
let directDb: ReturnType<typeof drizzle> | null = null;
export function getDirectDb() {
  if (!directDb) {
    const directUrl = process.env.DATABASE_URL_DIRECT;
    if (!directUrl) return db; // fallback to pooler if direct URL not set
    const directClient = postgres(directUrl, { prepare: false });
    directDb = drizzle(directClient, { schema });
  }
  return directDb;
}
