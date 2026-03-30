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
const db = drizzle(client, { schema });

export function getDb() {
  return db;
}
