import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  format: text("format").notNull(), // "the-bug", "the-satisfaction", etc.
  status: text("status", {
    enum: ["generating", "draft", "ready", "done"],
  })
    .notNull()
    .default("draft"),
  // Hook variants stored as JSON (small, always read together)
  hooks: jsonb("hooks").$type<
    {
      variant: string;
      visual: string;
      voiceover: string;
    }[]
  >(),
  selectedHook: text("selected_hook"), // "A", "B", or "C"
  // Titles stored as JSON (always 3, small array)
  titles: jsonb("titles").$type<string[]>(),
  thumbnail: text("thumbnail"),
  durationEstimate: text("duration_estimate"),
  // Anti-slop score as JSON (5 dimensions + total + notes)
  antiSlopScore: jsonb("anti_slop_score").$type<{
    directness: number;
    rhythm: number;
    trust: number;
    authenticity: number;
    density: number;
    total: number;
    notes: string;
  }>(),
  devContext: text("dev_context"), // Original input
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const beats = pgTable("beats", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id")
    .notNull()
    .references(() => scripts.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  visual: text("visual").notNull(),
  voiceover: text("voiceover").notNull().default(""),
  duration: text("duration"), // "2-3s"
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at"),
  channelTitle: text("channel_title"),
  scriptId: integer("script_id").references(() => scripts.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const youtubeTokens = pgTable("youtube_tokens", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiryDate: text("expiry_date"), // epoch ms as string (bigint)
  tokenType: text("token_type"),
  scope: text("scope"),
  channelTitle: text("channel_title"),
  channelThumbnailUrl: text("channel_thumbnail_url"),
  channelSubscriberCount: integer("channel_subscriber_count"),
  channelVideoCount: integer("channel_video_count"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const videoMetrics = pgTable("video_metrics", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" })
    .unique(),
  views: integer("views").notNull().default(0),
  engagedViews: integer("engaged_views"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  subscribersGained: integer("subscribers_gained").default(0),
  subscribersLost: integer("subscribers_lost").default(0),
  averageViewPercentage: integer("average_view_percentage"),
  averageViewDuration: integer("average_view_duration"),
  retentionCurve: jsonb("retention_curve").$type<number[]>(),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
});
