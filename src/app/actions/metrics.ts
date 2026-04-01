"use server";

import { getDb } from "@/lib/db";
import { scripts, videos, videoMetrics, youtubeTokens } from "@/lib/db/schema";
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

    // Update channel info (subscriber count, etc.) on every sync — force refresh from API
    try {
      const { getChannelInfo } = await import("@/lib/youtube-client");
      await getChannelInfo(true);
    } catch {
      // Non-blocking — channel info update is best-effort
    }

    for (const v of channelVideos) {
      // Check if video exists, then insert or update (Drizzle upsert has bugs with mixed sql/JS values)
      const [existingVideo] = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.youtubeId, v.youtubeId));

      if (existingVideo) {
        await db
          .update(videos)
          .set({
            title: v.title,
            description: v.description,
            thumbnailUrl: v.thumbnailUrl,
            updatedAt: new Date(),
          })
          .where(eq(videos.youtubeId, v.youtubeId));
      } else {
        await db
          .insert(videos)
          .values({
            youtubeId: v.youtubeId,
            title: v.title,
            description: v.description,
            thumbnailUrl: v.thumbnailUrl,
            publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
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
    const [videoRow] = await db
      .select()
      .from(videos)
      .where(eq(videos.youtubeId, youtubeId));
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

    const metricsData = {
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
    };

    const [existing] = await db
      .select({ id: videoMetrics.id })
      .from(videoMetrics)
      .where(eq(videoMetrics.videoId, videoRow.id));

    if (existing) {
      // Use direct connection — pooler (port 6543) silently drops video_metrics UPDATEs
      const { getDirectDb } = await import("@/lib/db");
      const directDb = getDirectDb();
      await directDb
        .update(videoMetrics)
        .set(metricsData)
        .where(eq(videoMetrics.id, existing.id));
    } else {
      await db
        .insert(videoMetrics)
        .values({ videoId: videoRow.id, ...metricsData });
    }

    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sync video metrics";
    return { success: false, error: message };
  }
}

export async function getScriptsWithMetrics(): Promise<ScriptWithVideo[]> {
  const db = getDb();

  const rows = await db
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
    .orderBy(desc(scripts.createdAt));

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
  // Read sync time from youtube_tokens.updated_at — reliably persists via saveTokens()
  const { loadTokens } = await import("@/lib/youtube-client");
  const tokens = await loadTokens();
  if (!tokens) return null;

  const db = getDb();
  const [row] = await db
    .select({ updatedAt: youtubeTokens.updatedAt })
    .from(youtubeTokens)
    .where(eq(youtubeTokens.id, 1));

  return row?.updatedAt ?? null;
}

export async function linkVideo(
  scriptId: number,
  videoId: number
): Promise<{ success: boolean }> {
  const db = getDb();
  await db
    .update(videos)
    .set({ scriptId, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  // Auto-set script status to "done" when linked to a video
  await db
    .update(scripts)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(scripts.id, scriptId));

  revalidatePath("/");
  revalidatePath(`/script/${scriptId}`);

  return { success: true };
}

export async function unlinkVideo(
  videoId: number
): Promise<{ success: boolean }> {
  const db = getDb();

  // Find the linked script before unlinking
  const [video] = await db
    .select({ scriptId: videos.scriptId })
    .from(videos)
    .where(eq(videos.id, videoId));

  await db
    .update(videos)
    .set({ scriptId: null, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  // Auto-revert script status to "draft" when unlinked
  if (video?.scriptId) {
    await db
      .update(scripts)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(scripts.id, video.scriptId));
  }

  revalidatePath("/");
  revalidatePath("/script/[id]");

  return { success: true };
}

export async function getUnlinkedVideos(): Promise<VideoData[]> {
  const db = getDb();

  const rows = await db
    .select()
    .from(videos)
    .where(isNull(videos.scriptId))
    .orderBy(desc(videos.publishedAt));

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

export interface VideoWithMetrics {
  video: VideoData;
  metrics: VideoMetricsData | null;
  linkedScriptTitle: string | null;
}

export async function getAllVideosWithMetrics(): Promise<VideoWithMetrics[]> {
  const db = getDb();

  const rows = await db
    .select({
      videoId: videos.id,
      videoYoutubeId: videos.youtubeId,
      videoTitle: videos.title,
      videoDescription: videos.description,
      videoThumbnailUrl: videos.thumbnailUrl,
      videoPublishedAt: videos.publishedAt,
      videoScriptId: videos.scriptId,
      scriptTitle: scripts.title,
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
    .leftJoin(scripts, eq(scripts.id, videos.scriptId))
    .orderBy(desc(videos.publishedAt));

  return rows.map((row) => ({
    video: {
      id: row.videoId,
      youtubeId: row.videoYoutubeId,
      title: row.videoTitle,
      description: row.videoDescription ?? null,
      thumbnailUrl: row.videoThumbnailUrl ?? null,
      publishedAt: row.videoPublishedAt ?? null,
      scriptId: row.videoScriptId ?? null,
    },
    metrics: row.metricsViews !== null
      ? {
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
        }
      : null,
    linkedScriptTitle: row.scriptTitle ?? null,
  }));
}

export interface ChannelStats {
  totalViews: number;
  totalLikes: number;
  subscriberCount: number;
  videoCount: number;
}

export interface GrowthPoint {
  date: string;
  timestamp: number; // epoch ms for proportional X positioning
  title: string;
  views: number;
  cumulativeViews: number;
  thumbnailUrl: string | null;
  netSubs: number; // subscribersGained - subscribersLost for this video
}

export interface TopVideo {
  title: string;
  thumbnailUrl: string | null;
  views: number;
  badge: string;
  badgeValue: string;
}

export async function getChannelStats(): Promise<ChannelStats> {
  const db = getDb();
  const { getChannelInfo } = await import("@/lib/youtube-client");

  const [agg] = await db
    .select({
      totalViews: sql<number>`COALESCE(SUM(${videoMetrics.views}), 0)`,
      totalLikes: sql<number>`COALESCE(SUM(${videoMetrics.likes}), 0)`,
    })
    .from(videoMetrics);

  const channelInfo = await getChannelInfo();

  return {
    totalViews: agg?.totalViews ?? 0,
    totalLikes: agg?.totalLikes ?? 0,
    subscriberCount: channelInfo?.subscriberCount ?? 0,
    videoCount: channelInfo?.videoCount ?? 0,
  };
}

export async function getGrowthTimeline(): Promise<GrowthPoint[]> {
  const db = getDb();

  const rows = await db
    .select({
      title: videos.title,
      publishedAt: videos.publishedAt,
      thumbnailUrl: videos.thumbnailUrl,
      views: videoMetrics.views,
      subsGained: videoMetrics.subscribersGained,
      subsLost: videoMetrics.subscribersLost,
    })
    .from(videos)
    .leftJoin(videoMetrics, eq(videoMetrics.videoId, videos.id))
    .orderBy(videos.publishedAt);

  let cumulative = 0;
  return rows.map((r) => {
    cumulative += r.views ?? 0;
    const d = r.publishedAt ? new Date(r.publishedAt) : new Date();
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      timestamp: d.getTime(),
      title: (r.title ?? "").replace(/\s*[|].*$/, "").replace(/\s*#\w+/g, "").trim(),
      views: r.views ?? 0,
      cumulativeViews: cumulative,
      thumbnailUrl: r.thumbnailUrl ?? null,
      netSubs: (r.subsGained ?? 0) - (r.subsLost ?? 0),
    };
  });
}

export async function getTopPerformers(): Promise<TopVideo[]> {
  const db = getDb();

  const rows = await db
    .select({
      title: videos.title,
      thumbnailUrl: videos.thumbnailUrl,
      views: videoMetrics.views,
      avgRetention: videoMetrics.averageViewPercentage,
      subsGained: videoMetrics.subscribersGained,
      engagedViews: videoMetrics.engagedViews,
    })
    .from(videos)
    .leftJoin(videoMetrics, eq(videoMetrics.videoId, videos.id))
    .where(ne(videoMetrics.views, 0))
    .orderBy(desc(videoMetrics.views));

  if (rows.length === 0) return [];

  const clean = (t: string) => t.replace(/\s*[|].*$/, "").replace(/\s*#\w+/g, "").trim();

  // Find best in each category
  const bestViews = rows[0]; // already sorted by views desc
  const bestRetention = rows.reduce((a, b) => ((a.avgRetention ?? 0) > (b.avgRetention ?? 0) ? a : b));
  const bestSubs = rows.reduce((a, b) => ((a.subsGained ?? 0) > (b.subsGained ?? 0) ? a : b));

  const seen = new Set<string>();
  const top: TopVideo[] = [];

  const add = (r: typeof rows[0], badge: string, badgeValue: string) => {
    const t = clean(r.title ?? "");
    if (seen.has(t)) return;
    seen.add(t);
    top.push({ title: t, thumbnailUrl: r.thumbnailUrl ?? null, views: r.views ?? 0, badge, badgeValue });
  };

  add(bestViews, "Most Viewed", `${((bestViews.views ?? 0) / 1000).toFixed(1)}K views`);
  add(bestSubs, "Most Subscribers", `+${bestSubs.subsGained} subs`);
  add(bestRetention, "Best Retention", `${bestRetention.avgRetention}% avg`);

  return top;
}

export async function getVideoForScript(
  scriptId: number
): Promise<{ video: VideoData; metrics: VideoMetricsData } | null> {
  const db = getDb();

  const [row] = await db
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
    .where(eq(videos.scriptId, scriptId));

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
