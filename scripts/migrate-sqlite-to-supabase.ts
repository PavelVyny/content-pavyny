/**
 * One-shot migration: SQLite -> Supabase PostgreSQL
 *
 * Reads all data from local SQLite (web/data/scripts.db),
 * converts timestamps from epoch integers to Date objects,
 * writes to Supabase via postgres-js, and resets serial sequences.
 *
 * Run with: npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Requires:
 *   - DATABASE_URL in .env.local (Supabase pooler connection)
 *   - web/data/scripts.db (local SQLite database)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Database from "better-sqlite3";
import postgres from "postgres";
import path from "path";

// --- Config ---

const DB_PATH = path.join(process.cwd(), "data", "scripts.db");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

// --- Timestamp conversion ---

function convertTimestamp(
  value: unknown,
  columnName: string
): Date | null {
  if (value === null || value === undefined) {
    console.log(`  ${columnName}: null -> null`);
    return null;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      console.log(`  ${columnName}: ISO string "${value}" -> ${parsed.toISOString()}`);
      return parsed;
    }
    // Try parsing string as number
    const num = Number(value);
    if (!isNaN(num)) {
      return convertTimestamp(num, columnName);
    }
    console.warn(`  ${columnName}: unparseable string "${value}" -> null`);
    return null;
  }

  if (typeof value === "number") {
    if (value > 1e12) {
      // Milliseconds
      const d = new Date(value);
      console.log(`  ${columnName}: ${value} (ms) -> ${d.toISOString()}`);
      return d;
    }
    if (value > 0) {
      // Seconds
      const d = new Date(value * 1000);
      console.log(`  ${columnName}: ${value} (sec) -> ${d.toISOString()}`);
      return d;
    }
  }

  console.warn(`  ${columnName}: unexpected value ${value} -> null`);
  return null;
}

// --- JSON parsing ---

function parseJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

// --- Main migration ---

async function migrate() {
  console.log("Opening SQLite database:", DB_PATH);
  const sqlite = new Database(DB_PATH, { readonly: true });
  sqlite.pragma("journal_mode = WAL");

  const sql = postgres(DATABASE_URL!, { prepare: false });

  try {
    await sql.begin(async (tx) => {
      // === 1. Scripts ===
      console.log("\n--- Migrating scripts ---");
      const sqliteScripts = sqlite
        .prepare("SELECT * FROM scripts")
        .all() as Record<string, unknown>[];
      console.log(`Found ${sqliteScripts.length} scripts in SQLite`);

      for (const row of sqliteScripts) {
        console.log(`\nScript #${row.id}: "${row.title}"`);
        const createdAt = convertTimestamp(row.created_at, "created_at");
        const updatedAt = convertTimestamp(row.updated_at, "updated_at");

        await tx`
          INSERT INTO scripts (id, title, format, status, hooks, selected_hook, titles, thumbnail, duration_estimate, anti_slop_score, dev_context, created_at, updated_at)
          VALUES (
            ${row.id as number},
            ${row.title as string},
            ${row.format as string},
            ${(row.status as string) || "draft"},
            ${sql.json(parseJson(row.hooks))},
            ${row.selected_hook as string | null},
            ${sql.json(parseJson(row.titles))},
            ${row.thumbnail as string | null},
            ${row.duration_estimate as string | null},
            ${sql.json(parseJson(row.anti_slop_score))},
            ${row.dev_context as string | null},
            ${createdAt},
            ${updatedAt}
          )
        `;
      }

      // Reset sequence
      await tx`SELECT setval(pg_get_serial_sequence('scripts', 'id'), (SELECT COALESCE(MAX(id), 0) FROM scripts))`;

      // === 2. Beats ===
      console.log("\n--- Migrating beats ---");
      const sqliteBeats = sqlite
        .prepare("SELECT * FROM beats")
        .all() as Record<string, unknown>[];
      console.log(`Found ${sqliteBeats.length} beats in SQLite`);

      for (const row of sqliteBeats) {
        await tx`
          INSERT INTO beats (id, script_id, "order", visual, voiceover, duration)
          VALUES (
            ${row.id as number},
            ${row.script_id as number},
            ${row.order as number},
            ${row.visual as string},
            ${(row.voiceover as string) || ""},
            ${row.duration as string | null}
          )
        `;
      }

      await tx`SELECT setval(pg_get_serial_sequence('beats', 'id'), (SELECT COALESCE(MAX(id), 0) FROM beats))`;

      // === 3. Videos ===
      console.log("\n--- Migrating videos ---");
      const sqliteVideos = sqlite
        .prepare("SELECT * FROM videos")
        .all() as Record<string, unknown>[];
      console.log(`Found ${sqliteVideos.length} videos in SQLite`);

      for (const row of sqliteVideos) {
        console.log(`\nVideo #${row.id}: "${row.title}"`);
        const publishedAt = convertTimestamp(row.published_at, "published_at");
        const createdAt = convertTimestamp(row.created_at, "created_at");
        const updatedAt = convertTimestamp(row.updated_at, "updated_at");

        await tx`
          INSERT INTO videos (id, youtube_id, title, description, thumbnail_url, published_at, channel_title, script_id, created_at, updated_at)
          VALUES (
            ${row.id as number},
            ${row.youtube_id as string},
            ${row.title as string},
            ${row.description as string | null},
            ${row.thumbnail_url as string | null},
            ${publishedAt},
            ${row.channel_title as string | null},
            ${row.script_id as number | null},
            ${createdAt},
            ${updatedAt}
          )
        `;
      }

      await tx`SELECT setval(pg_get_serial_sequence('videos', 'id'), (SELECT COALESCE(MAX(id), 0) FROM videos))`;

      // === 4. Video Metrics ===
      console.log("\n--- Migrating video_metrics ---");
      const sqliteMetrics = sqlite
        .prepare("SELECT * FROM video_metrics")
        .all() as Record<string, unknown>[];
      console.log(`Found ${sqliteMetrics.length} video_metrics in SQLite`);

      for (const row of sqliteMetrics) {
        console.log(`\nMetric #${row.id} for video_id=${row.video_id}`);
        const lastSyncedAt = convertTimestamp(row.last_synced_at, "last_synced_at");

        await tx`
          INSERT INTO video_metrics (id, video_id, views, engaged_views, likes, comments, shares, subscribers_gained, subscribers_lost, average_view_percentage, average_view_duration, retention_curve, last_synced_at)
          VALUES (
            ${row.id as number},
            ${row.video_id as number},
            ${(row.views as number) || 0},
            ${row.engaged_views as number | null},
            ${(row.likes as number) || 0},
            ${(row.comments as number) || 0},
            ${(row.shares as number) || 0},
            ${(row.subscribers_gained as number) || 0},
            ${(row.subscribers_lost as number) || 0},
            ${row.average_view_percentage != null ? Math.round(row.average_view_percentage as number) : null},
            ${row.average_view_duration != null ? Math.round(row.average_view_duration as number) : null},
            ${sql.json(parseJson(row.retention_curve))},
            ${lastSyncedAt}
          )
        `;
      }

      await tx`SELECT setval(pg_get_serial_sequence('video_metrics', 'id'), (SELECT COALESCE(MAX(id), 0) FROM video_metrics))`;

      // === Summary ===
      console.log("\n\nMigration complete:");
      console.log(`  scripts: ${sqliteScripts.length} rows`);
      console.log(`  beats: ${sqliteBeats.length} rows`);
      console.log(`  videos: ${sqliteVideos.length} rows`);
      console.log(`  video_metrics: ${sqliteMetrics.length} rows`);
    });
  } catch (err) {
    console.error("\nMigration FAILED — transaction rolled back");
    console.error(err);
    process.exit(1);
  } finally {
    sqlite.close();
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
