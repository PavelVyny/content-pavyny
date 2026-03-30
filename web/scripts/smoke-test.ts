/**
 * Smoke test for Supabase PostgreSQL migration.
 *
 * Exercises each table: insert, read, update, delete.
 * Run with: npx tsx scripts/smoke-test.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const { scripts, beats, videos, videoMetrics } = schema;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

async function run() {
  console.log("Smoke test: Supabase PostgreSQL migration\n");

  // --- Scripts table ---
  let scriptId: number;

  await test("Insert script", async () => {
    const [row] = await db
      .insert(scripts)
      .values({
        title: "Smoke Test Script",
        format: "the-bug",
        status: "draft",
        devContext: "Testing Supabase migration",
      })
      .returning();
    scriptId = row.id;
    if (!scriptId) throw new Error("No ID returned");
  });

  await test("Read script", async () => {
    const [row] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptId!));
    if (!row) throw new Error("Script not found");
    if (row.title !== "Smoke Test Script") throw new Error("Title mismatch");
  });

  await test("Update script status", async () => {
    await db
      .update(scripts)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(scripts.id, scriptId!));
    const [row] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptId!));
    if (row?.status !== "ready") throw new Error("Status not updated");
  });

  // --- Beats table ---
  let beatId: number;

  await test("Insert beat", async () => {
    const [row] = await db
      .insert(beats)
      .values({
        scriptId: scriptId!,
        order: 1,
        visual: "Screen recording of Unreal Editor",
        voiceover: "So I found this bug...",
        duration: "3-4s",
      })
      .returning();
    beatId = row.id;
    if (!beatId) throw new Error("No beat ID returned");
  });

  await test("Read beat", async () => {
    const [row] = await db
      .select()
      .from(beats)
      .where(eq(beats.id, beatId!));
    if (!row) throw new Error("Beat not found");
    if (row.order !== 1) throw new Error("Order mismatch");
  });

  // --- Videos table ---
  let videoId: number;

  await test("Insert video", async () => {
    const [row] = await db
      .insert(videos)
      .values({
        youtubeId: "smoke_test_123",
        title: "Smoke Test Video",
        publishedAt: new Date(),
      })
      .returning();
    videoId = row.id;
    if (!videoId) throw new Error("No video ID returned");
  });

  // --- Video Metrics table ---
  await test("Insert video metrics", async () => {
    const [row] = await db
      .insert(videoMetrics)
      .values({
        videoId: videoId!,
        views: 1000,
        likes: 50,
        retentionCurve: [100, 90, 80, 70, 60],
      })
      .returning();
    if (!row.id) throw new Error("No metrics ID returned");
  });

  await test("Read video metrics with jsonb", async () => {
    const [row] = await db
      .select()
      .from(videoMetrics)
      .where(eq(videoMetrics.videoId, videoId!));
    if (!row) throw new Error("Metrics not found");
    if (row.views !== 1000) throw new Error("Views mismatch");
    const curve = row.retentionCurve as number[] | null;
    if (!curve || curve.length !== 5) throw new Error("Retention curve mismatch");
  });

  // --- Cleanup ---
  await test("Delete test data (cascade)", async () => {
    await db.delete(videoMetrics).where(eq(videoMetrics.videoId, videoId!));
    await db.delete(videos).where(eq(videos.id, videoId!));
    // beats cascade from script delete
    await db.delete(scripts).where(eq(scripts.id, scriptId!));
  });

  // --- Summary ---
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
