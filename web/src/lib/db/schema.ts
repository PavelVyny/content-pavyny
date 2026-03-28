import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const scripts = sqliteTable("scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  format: text("format").notNull(), // "the-bug", "the-satisfaction", etc.
  status: text("status", {
    enum: ["generating", "draft", "ready", "recorded"],
  })
    .notNull()
    .default("draft"),
  // Hook variants stored as JSON (small, always read together)
  hooks: text("hooks", { mode: "json" }).$type<
    {
      variant: string;
      visual: string;
      voiceover: string;
    }[]
  >(),
  selectedHook: text("selected_hook"), // "A", "B", or "C"
  // Titles stored as JSON (always 3, small array)
  titles: text("titles", { mode: "json" }).$type<string[]>(),
  thumbnail: text("thumbnail"),
  durationEstimate: text("duration_estimate"),
  // Anti-slop score as JSON (5 dimensions + total + notes)
  antiSlopScore: text("anti_slop_score", { mode: "json" }).$type<{
    directness: number;
    rhythm: number;
    trust: number;
    authenticity: number;
    density: number;
    total: number;
    notes: string;
  }>(),
  devContext: text("dev_context"), // Original input
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const beats = sqliteTable("beats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptId: integer("script_id")
    .notNull()
    .references(() => scripts.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  visual: text("visual").notNull(),
  voiceover: text("voiceover").notNull().default(""),
  duration: text("duration"), // "2-3s"
});
