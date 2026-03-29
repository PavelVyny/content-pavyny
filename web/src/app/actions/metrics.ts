"use server";

import { getDb } from "@/lib/db";
import { scripts, videos, videoMetrics } from "@/lib/db/schema";
import { eq, desc, ne, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  listChannelVideos,
  getVideoMetrics,
  getRetentionData,
} from "@/lib/youtube-client";
import type { ScriptWithVideo, VideoData, VideoMetricsData } from "@/lib/types";
import type { HookVariant } from "@/lib/types";

export async function discoverVideos(): Promise<{
  success: boolean;
  videos: Array<{ youtubeId: string; title: string }>;
  error?: string;
}> {
  try {
    const channelVideos = await listChannelVideos();
    const db = getDb();

    for (const v of channelVideos) {
      db.insert(videos)
        .values({
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: videos.youtubeId,
          set: {
            title: sql`excluded.title`,
            description: sql`excluded.description`,
            thumbnailUrl: sql`excluded.thumbnail_url`,
            updatedAt: new Date(),
          },
        })
        .run();
    }

    return {
      success: true,
      videos: channelVideos.map((v) => ({
        youtubeId: v.youtubeId,
        title: v.title,
      })),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to discover videos";
    return { success: false, videos: [], error: message };
  }
}

export async function syncSingleVideo(
  youtubeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // Look up DB video row
    const videoRow = db
      .select()
      .from(videos)
      .where(eq(videos.youtubeId, youtubeId))
      .get();
    if (!videoRow) {
      return { success: false, error: `Video not found: ${youtubeId}` };
    }

    // Fetch basic metrics (single-element array -- intentional for per-video progress per D-06)
    const metricsRows = await getVideoMetrics([youtubeId], "2024-01-01");
    // metricsRows: [[videoId, views, likes, comments, shares, subsGained, subsLost, avgViewPct, avgViewDuration, engagedViews]]
    const row = metricsRows[0] as
      | (string | number)[]
      | undefined;

    // Fetch retention curve
    const retentionCurve = await getRetentionData(youtubeId, "2024-01-01");

    const now = new Date();

    db.insert(videoMetrics)
      .values({
        videoId: videoRow.id,
        views: row ? Number(row[1]) : 0,
        likes: row ? Number(row[2]) : 0,
        comments: row ? Number(row[3]) : 0,
        shares: row ? Number(row[4]) : 0,
        subscribersGained: row ? Number(row[5]) : 0,
        subscribersLost: row ? Number(row[6]) : 0,
        averageViewPercentage: row ? Number(row[7]) : 0,
        averageViewDuration: row ? Number(row[8]) : 0,
        engagedViews: row ? Number(row[9]) : 0,
        retentionCurve: retentionCurve.length > 0 ? retentionCurve : null,
        lastSyncedAt: now,
      })
      .onConflictDoUpdate({
        target: videoMetrics.videoId,
        set: {
          views: sql`excluded.views`,
          likes: sql`excluded.likes`,
          comments: sql`excluded.comments`,
          shares: sql`excluded.shares`,
          subscribersGained: sql`excluded.subscribers_gained`,
          subscribersLost: sql`excluded.subscribers_lost`,
          averageViewPercentage: sql`excluded.average_view_percentage`,
          averageViewDuration: sql`excluded.average_view_duration`,
          engagedViews: sql`excluded.engaged_views`,
          retentionCurve: sql`excluded.retention_curve`,
          lastSyncedAt: now,
        },
      })
      .run();

    revalidatePath("/scripts");

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sync video metrics";
    return { success: false, error: message };
  }
}

export async function getScriptsWithMetrics(): Promise<ScriptWithVideo[]> {
  const db = getDb();

  const rows = db
    .select({
      // Script fields
      scriptId: scripts.id,
      scriptTitle: scripts.title,
      scriptFormat: scripts.format,
      scriptStatus: scripts.status,
      scriptHooks: scripts.hooks,
      scriptSelectedHook: scripts.selectedHook,
      scriptTitles: scripts.titles,
      scriptThumbnail: scripts.thumbnail,
      scriptDurationEstimate: scripts.durationEstimate,
      scriptAntiSlopScore: scripts.antiSlopScore,
      scriptDevContext: scripts.devContext,
      scriptCreatedAt: scripts.createdAt,
      scriptUpdatedAt: scripts.updatedAt,
      // Video fields
      videoId: videos.id,
      videoYoutubeId: videos.youtubeId,
      videoTitle: videos.title,
      videoDescription: videos.description,
      videoThumbnailUrl: videos.thumbnailUrl,
      videoPublishedAt: videos.publishedAt,
      videoScriptId: videos.scriptId,
      // Metrics fields
      metricsViews: videoMetrics.views,
      metricsLikes: videoMetrics.likes,
      metricsComments: videoMetrics.comments,
      metricsShares: videoMetrics.shares,
      metricsSubsGained: videoMetrics.subscribersGained,
      metricsSubsLost: videoMetrics.subscribersLost,
      metricsAvgViewPct: videoMetrics.averageViewPercentage,
      metricsAvgViewDuration: videoMetrics.averageViewDuration,
      metricsEngagedViews: videoMetrics.engagedViews,
      metricsRetentionCurve: videoMetrics.retentionCurve,
      metricsLastSyncedAt: videoMetrics.lastSyncedAt,
    })
    .from(scripts)
    .leftJoin(videos, eq(videos.scriptId, scripts.id))
    .leftJoin(videoMetrics, eq(videoMetrics.videoId, videos.id))
    .where(ne(scripts.status, "generating"))
    .orderBy(desc(scripts.createdAt))
    .all();

  return rows.map((r) => ({
    id: r.scriptId,
    title: r.scriptTitle,
    format: r.scriptFormat,
    status: r.scriptStatus as ScriptWithVideo["status"],
    hooks: (r.scriptHooks as HookVariant[] | null) ?? null,
    selectedHook: r.scriptSelectedHook,
    titles: (r.scriptTitles as string[] | null) ?? null,
    thumbnail: r.scriptThumbnail,
    durationEstimate: r.scriptDurationEstimate,
    antiSlopScore: r.scriptAntiSlopScore ?? null,
    devContext: r.scriptDevContext,
    createdAt: r.scriptCreatedAt,
    updatedAt: r.scriptUpdatedAt,
    video: r.videoId
      ? {
          id: r.videoId,
          youtubeId: r.videoYoutubeId!,
          title: r.videoTitle!,
          description: r.videoDescription ?? null,
          thumbnailUrl: r.videoThumbnailUrl ?? null,
          publishedAt: r.videoPublishedAt ?? null,
          scriptId: r.videoScriptId ?? null,
        }
      : null,
    metrics:
      r.videoId && r.metricsLastSyncedAt
        ? {
            views: r.metricsViews ?? 0,
            likes: r.metricsLikes ?? 0,
            comments: r.metricsComments ?? 0,
            shares: r.metricsShares ?? 0,
            subscribersGained: r.metricsSubsGained ?? 0,
            subscribersLost: r.metricsSubsLost ?? 0,
            averageViewPercentage: r.metricsAvgViewPct ?? 0,
            averageViewDuration: r.metricsAvgViewDuration ?? 0,
            engagedViews: r.metricsEngagedViews ?? 0,
            retentionCurve: (r.metricsRetentionCurve as number[] | null) ?? null,
            lastSyncedAt: r.metricsLastSyncedAt,
          }
        : null,
  }));
}

export async function getLastSyncTime(): Promise<Date | null> {
  const db = getDb();

  const result = db
    .select({
      maxSync: sql<number>`MAX(${videoMetrics.lastSyncedAt})`,
    })
    .from(videoMetrics)
    .get();

  if (!result?.maxSync) return null;

  // SQLite stores timestamps as integers (seconds since epoch via Drizzle mode: "timestamp")
  // But Drizzle's mode: "timestamp" already handles conversion, so maxSync is already ms
  // However, raw sql<number> bypasses Drizzle's conversion — multiply by 1000
  return new Date(result.maxSync * 1000);
}

export async function linkVideo(
  scriptId: number,
  videoId: number
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(videos)
    .set({ scriptId, updatedAt: new Date() })
    .where(eq(videos.id, videoId))
    .run();

  revalidatePath("/scripts");
  revalidatePath(`/script/${scriptId}`);

  return { success: true };
}

export async function unlinkVideo(
  videoId: number
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(videos)
    .set({ scriptId: null, updatedAt: new Date() })
    .where(eq(videos.id, videoId))
    .run();

  revalidatePath("/scripts");
  revalidatePath("/script/[id]");

  return { success: true };
}

export async function getUnlinkedVideos(): Promise<VideoData[]> {
  const db = getDb();

  const rows = db
    .select()
    .from(videos)
    .where(isNull(videos.scriptId))
    .orderBy(desc(videos.publishedAt))
    .all();

  return rows.map((r) => ({
    id: r.id,
    youtubeId: r.youtubeId,
    title: r.title,
    description: r.description ?? null,
    thumbnailUrl: r.thumbnailUrl ?? null,
    publishedAt: r.publishedAt ?? null,
    scriptId: r.scriptId ?? null,
  }));
}

export async function getVideoForScript(
  scriptId: number
): Promise<{ video: VideoData; metrics: VideoMetricsData } | null> {
  const db = getDb();

  const row = db
    .select({
      videoId: videos.id,
      videoYoutubeId: videos.youtubeId,
      videoTitle: videos.title,
      videoDescription: videos.description,
      videoThumbnailUrl: videos.thumbnailUrl,
      videoPublishedAt: videos.publishedAt,
      videoScriptId: videos.scriptId,
      metricsViews: videoMetrics.views,
      metricsLikes: videoMetrics.likes,
      metricsComments: videoMetrics.comments,
      metricsShares: videoMetrics.shares,
      metricsSubsGained: videoMetrics.subscribersGained,
      metricsSubsLost: videoMetrics.subscribersLost,
      metricsAvgViewPct: videoMetrics.averageViewPercentage,
      metricsAvgViewDuration: videoMetrics.averageViewDuration,
      metricsEngagedViews: videoMetrics.engagedViews,
      metricsRetentionCurve: videoMetrics.retentionCurve,
      metricsLastSyncedAt: videoMetrics.lastSyncedAt,
    })
    .from(videos)
    .leftJoin(videoMetrics, eq(videoMetrics.videoId, videos.id))
    .where(eq(videos.scriptId, scriptId))
    .get();

  if (!row) return null;

  return {
    video: {
      id: row.videoId,
      youtubeId: row.videoYoutubeId,
      title: row.videoTitle,
      description: row.videoDescription ?? null,
      thumbnailUrl: row.videoThumbnailUrl ?? null,
      publishedAt: row.videoPublishedAt ?? null,
      scriptId: row.videoScriptId ?? null,
    },
    metrics: {
      views: row.metricsViews ?? 0,
      likes: row.metricsLikes ?? 0,
      comments: row.metricsComments ?? 0,
      shares: row.metricsShares ?? 0,
      subscribersGained: row.metricsSubsGained ?? 0,
      subscribersLost: row.metricsSubsLost ?? 0,
      averageViewPercentage: row.metricsAvgViewPct ?? 0,
      averageViewDuration: row.metricsAvgViewDuration ?? 0,
      engagedViews: row.metricsEngagedViews ?? 0,
      retentionCurve: (row.metricsRetentionCurve as number[] | null) ?? null,
      lastSyncedAt: row.metricsLastSyncedAt ?? new Date(),
    },
  };
}
