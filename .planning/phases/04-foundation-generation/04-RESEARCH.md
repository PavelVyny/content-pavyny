# Phase 4: Foundation & Generation - Research

**Researched:** 2026-03-28
**Domain:** Next.js 16 app scaffold + SQLite/Drizzle + Claude Agent SDK + generation form
**Confidence:** HIGH

## Summary

Phase 4 builds a greenfield Next.js 16 web app that wraps the existing CLI-based devlog-scriptwriter skill. The app must: scaffold the project with shadcn/ui v4, set up SQLite with structured beats via Drizzle ORM, integrate the Claude Agent SDK for script generation using structured JSON output, and provide a generation form with format selection and dev progress input.

The critical implementation details researched here focus on: (1) Claude Agent SDK's exact `query()` API with structured output via `outputFormat`, (2) Drizzle ORM schema for scripts with structured beats, (3) Agent SDK authentication -- the SDK officially requires an API key even though non-bare mode can read OAuth from keychain, (4) output parsing from Agent SDK's `structured_output` field rather than markdown parsing, and (5) Windows compatibility for better-sqlite3 (requires compilation from source, VS 2022 confirmed available).

**Primary recommendation:** Use Claude Agent SDK `query()` with `outputFormat: { type: "json_schema", schema }` to get structured script output directly, eliminating the need for markdown parsing entirely. Authenticate with `ANTHROPIC_API_KEY` per official SDK documentation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) which spawns Claude Code CLI as subprocess. This uses Pavlo's Max subscription -- zero additional API cost.
- **D-02:** The Agent SDK automatically loads the devlog-scriptwriter skill from `.claude/skills/` because it spawns Claude Code in the project directory.
- **D-03:** No streaming -- full response with loading state. Agent SDK returns complete result, web app parses structured output.
- **D-04:** Clean light theme, Notion-style. shadcn/ui v4 components.
- **D-05:** No dark mode toggle -- single theme.
- **D-06:** Next.js 16 with App Router, Tailwind CSS, TypeScript.
- **D-07:** SQLite with Drizzle ORM and better-sqlite3. Scripts stored as structured beats (separate rows/JSON column), not text blobs.
- **D-08:** Reference files (brand-voice.md, anti-slop-rules.md, video-formats.md) read from `.claude/skills/devlog-scriptwriter/references/` at runtime via `fs.readFileSync`. Shared source of truth with CLI.
- **D-09:** Use the `frontend-design` skill when implementing any UI/UX work.

### Claude's Discretion
- Project structure (root vs subfolder vs monorepo)
- Generation form layout and UX
- Prompt construction for Agent SDK
- Database schema details (column types, indexes)
- Loading/error state UI
- Output parsing strategy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| APFN-01 | Next.js 16 app scaffold with App Router, Tailwind CSS, shadcn/ui v4 | Standard Stack section: verified Next.js 16.2.1, shadcn CLI 4.1.1, Tailwind v4 setup |
| APFN-02 | SQLite database with Drizzle ORM -- scripts table with structured beats, status field | Architecture Patterns: Drizzle schema with scripts + beats tables, WAL mode |
| APFN-03 | Claude Agent SDK integration using Max subscription auth -- spawns Claude Code with skill access | Agent SDK API section: `query()` with structured output, auth mechanism, skill loading |
| APFN-04 | Reference file reader -- loads brand-voice.md, anti-slop-rules.md, video-formats.md at runtime | Code Examples: `fs.readFileSync` from `.claude/skills/devlog-scriptwriter/references/` |
| GENR-01 | Generation form -- format selector (7 formats), dev progress text input, generate button | Architecture Patterns: form design using video-formats.md as data source |
| GENR-02 | Structured output parsing -- dual-track beats, hook variants, titles, thumbnail, anti-slop score | Agent SDK structured output: `outputFormat` with JSON schema eliminates markdown parsing |
| GENR-03 | Full script re-generation -- re-generate entire script with same or modified input | Agent SDK: new `query()` call with same/modified prompt, save as new script or overwrite |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Communicate with Pavlo in Russian; scripts in English
- Anti-slop is priority #1 -- AI-sounding output is worse than no output
- Scripts must be easy to pronounce for non-native English speaker
- One Short = one idea
- Visuals drive, voice follows
- Use GSD workflow for all code changes
- Use `frontend-design` skill (at `~/.claude/skills/frontend-design/`) for all UI work

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack React framework | Current stable. App Router, Turbopack default, React 19. |
| `@anthropic-ai/claude-agent-sdk` | 0.2.86 | AI backend | Official SDK. Spawns Claude Code subprocess. Structured JSON output. |
| Drizzle ORM | 0.45.2 | Database ORM | Type-safe, sync SQLite via better-sqlite3, ~50KB. |
| better-sqlite3 | 12.8.0 | SQLite driver | Synchronous API. Requires Node 20+. |
| Tailwind CSS | 4.x | Styling | Ships with `create-next-app`. OKLCH color tokens. |
| shadcn/ui | CLI 4.1.1 | UI components | Copy-paste Radix primitives. Full Next.js 16 + React 19 + Tailwind v4 compatibility. |
| zod | 3.x | Schema validation | Validates Agent SDK structured output schemas. Peer dep of the SDK. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | latest | Toast notifications | "Script generated", error messages. shadcn/ui includes it. |
| `lucide-react` | latest | Icons | shadcn/ui's icon library. |
| `drizzle-kit` | 0.31.10 | DB migrations | `npx drizzle-kit push` for dev. |
| `@types/better-sqlite3` | latest | TypeScript types | Dev dependency for better-sqlite3. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-sqlite3 | `node:sqlite` (built-in Node 24) | Available but experimental; drizzle-kit does not fully support it for migrations |
| better-sqlite3 | `sql.js` | Pure JS (no native compilation), but slower and larger WASM binary; fallback if native build fails |
| Drizzle ORM | Raw better-sqlite3 | Skip ORM overhead; but lose type-safe schema and migration tooling |

**Installation:**
```bash
# Scaffold Next.js 16 project
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir

# Core dependencies
cd web
npm install @anthropic-ai/claude-agent-sdk drizzle-orm better-sqlite3 zod

# Dev dependencies
npm install -D drizzle-kit @types/better-sqlite3

# shadcn/ui init + components
npx shadcn@latest init
npx shadcn@latest add button card input textarea select badge
```

## Architecture Patterns

### Recommended Project Structure

```
content-pavyny/
├── .claude/skills/devlog-scriptwriter/   # EXISTING -- skill + references
├── scripts/                              # EXISTING -- generated script files
├── web/                                  # NEW -- Next.js app (subfolder)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout
│   │   │   ├── page.tsx                 # Home / generation page
│   │   │   ├── scripts/[id]/page.tsx    # Script view (Phase 5)
│   │   │   └── actions/
│   │   │       └── generate.ts          # Server Action for generation
│   │   ├── components/
│   │   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── generate-form.tsx        # Format selector + context input
│   │   │   ├── script-display.tsx       # Read-only dual-track display
│   │   │   ├── format-card.tsx          # Individual format option
│   │   │   └── loading-state.tsx        # Generation loading indicator
│   │   ├── lib/
│   │   │   ├── agent.ts                 # Agent SDK wrapper
│   │   │   ├── db/
│   │   │   │   ├── index.ts             # SQLite connection singleton
│   │   │   │   └── schema.ts            # Drizzle schema
│   │   │   ├── references.ts            # Read reference files from disk
│   │   │   └── types.ts                 # Shared TypeScript types
│   │   └── drizzle.config.ts            # Drizzle Kit config
│   ├── data/                            # SQLite DB file location
│   │   └── .gitkeep
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
└── .planning/                            # EXISTING
```

**Why subfolder (`web/`):** The project root has existing files (CLAUDE.md, scripts/, .claude/skills/) that should not be mixed with a Next.js project's node_modules, .next/, etc. A `web/` subfolder keeps the Next.js app self-contained while the Agent SDK's `cwd` option points to the project root for skill access.

### Pattern 1: Agent SDK with Structured Output (GENR-02)

**What:** Use the Agent SDK `query()` with `outputFormat` to get typed JSON directly from Claude Code, bypassing markdown parsing entirely. The Agent SDK spawns Claude Code which reads the skill, generates the script, and returns structured data matching the Zod schema.

**When to use:** Every script generation request.

**Example:**

```typescript
// src/lib/agent.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import path from "path";

// Define the output schema
const ScriptOutputSchema = z.object({
  hooks: z.array(z.object({
    variant: z.string(), // "A", "B", "C"
    visual: z.string(),
    voiceover: z.string(),
  })),
  beats: z.array(z.object({
    visual: z.string(),
    voiceover: z.string(),
    duration: z.string().optional(), // "2-3s"
  })),
  titles: z.array(z.string()).length(3),
  thumbnail: z.string(),
  duration_estimate: z.string(),
  anti_slop_score: z.object({
    directness: z.number(),
    rhythm: z.number(),
    trust: z.number(),
    authenticity: z.number(),
    density: z.number(),
    total: z.number(),
    notes: z.string(),
  }),
});

type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

// Project root where .claude/skills/ lives
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

export async function generateScript(
  format: string,
  devContext: string
): Promise<ScriptOutput> {
  const messages: unknown[] = [];

  for await (const message of query({
    prompt: `Generate a devlog script using the "${format}" format.\n\nDev context: ${devContext}`,
    options: {
      cwd: PROJECT_ROOT,
      // Load project settings so CLAUDE.md and skills are available
      settingSources: ["project"],
      // Use Claude Code's system prompt which includes skill loading
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "Use the devlog-scriptwriter skill in Script Generation mode."
      },
      // Auto-approve reading reference files
      allowedTools: ["Read"],
      // Deny any file modifications
      disallowedTools: ["Write", "Edit", "Bash"],
      // Get structured JSON output
      outputFormat: {
        type: "json_schema",
        schema: z.toJSONSchema(ScriptOutputSchema),
      },
      // Limit agentic turns for predictable response times
      maxTurns: 5,
      // Permission mode: deny anything not in allowedTools
      permissionMode: "dontAsk",
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success" && message.structured_output) {
        const parsed = ScriptOutputSchema.safeParse(message.structured_output);
        if (parsed.success) {
          return parsed.data;
        }
        throw new Error("Structured output validation failed");
      } else {
        throw new Error(`Generation failed: ${message.subtype}`);
      }
    }
  }

  throw new Error("No result message received");
}
```

**Key design decisions:**
- `settingSources: ["project"]` loads CLAUDE.md and skills from the project directory
- `systemPrompt: { type: "preset", preset: "claude_code", append: "..." }` uses Claude Code's full system prompt (which knows how to load skills) plus a directive to use the scriptwriter skill
- `disallowedTools: ["Write", "Edit", "Bash"]` prevents Claude from modifying files during generation
- `permissionMode: "dontAsk"` denies anything not explicitly allowed, so the generation runs unattended
- `outputFormat` with JSON schema means the result comes back as validated JSON in `message.structured_output`, not as markdown that needs parsing

### Pattern 2: Drizzle Schema with Structured Beats (APFN-02)

**What:** Two-table schema where beats are separate rows linked to scripts, not JSON blobs. This enables per-beat editing, reordering, and anti-slop scoring in Phase 5.

```typescript
// src/lib/db/schema.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const scripts = sqliteTable("scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  format: text("format").notNull(),        // "the-bug", "the-satisfaction", etc.
  status: text("status", {
    enum: ["generating", "draft", "ready", "recorded"]
  }).notNull().default("draft"),
  // Hook variants stored as JSON (small, always read together)
  hooks: text("hooks", { mode: "json" }).$type<{
    variant: string;
    visual: string;
    voiceover: string;
  }[]>(),
  selectedHook: text("selected_hook"),     // "A", "B", or "C"
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
  devContext: text("dev_context"),          // Original input
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
  duration: text("duration"),              // "2-3s"
});
```

**Why separate beats table instead of JSON column:**
- D-07 explicitly says "structured beats (separate rows/JSON column), not text blobs"
- Separate table enables Phase 5 features: per-beat editing, single-beat regeneration (EDIT-04), per-beat anti-slop scanning
- Hooks/titles/score stay as JSON columns because they are small, always read as a unit, and do not need per-item queries

### Pattern 3: SQLite Connection Singleton with WAL Mode

```typescript
// src/lib/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "scripts.db");

// Module-level singleton -- survives hot reload in dev
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    // WAL mode for concurrent read/write (two browser tabs)
    sqlite.pragma("journal_mode = WAL");
    // Foreign keys enforcement
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}
```

### Pattern 4: Reference File Reader (APFN-04)

```typescript
// src/lib/references.ts
import { readFileSync } from "fs";
import { join } from "path";

const REFS_DIR = join(
  process.cwd(),
  "..",  // Up from web/ to project root
  ".claude/skills/devlog-scriptwriter/references"
);

export interface VideoFormat {
  name: string;       // "The Bug"
  slug: string;       // "the-bug"
  description: string;
  beatCount: number;
}

export function readBrandVoice(): string {
  return readFileSync(join(REFS_DIR, "brand-voice.md"), "utf-8");
}

export function readAntiSlopRules(): string {
  return readFileSync(join(REFS_DIR, "anti-slop-rules.md"), "utf-8");
}

export function readVideoFormats(): string {
  return readFileSync(join(REFS_DIR, "video-formats.md"), "utf-8");
}

export function getFormatList(): VideoFormat[] {
  // Parsed from video-formats.md structure
  return [
    { name: "The Bug", slug: "the-bug", description: "Something broke in a funny, dramatic, or surprising way", beatCount: 4 },
    { name: "The Satisfaction", slug: "the-satisfaction", description: "A mechanic, visual, or sound effect looks/feels satisfying", beatCount: 3 },
    { name: "Before/After", slug: "before-after", description: "A feature went through a visible transformation", beatCount: 3 },
    { name: "The Decision", slug: "the-decision", description: "A design decision or dilemma", beatCount: 4 },
    { name: "The Trick", slug: "the-trick", description: "A clever solution that made something work", beatCount: 4 },
    { name: "The Fail", slug: "the-fail", description: "Significant effort that did not work out", beatCount: 4 },
    { name: "The Number", slug: "the-number", description: "A specific number tells the story", beatCount: 4 },
  ];
}
```

### Pattern 5: Server Action for Generation (No Streaming per D-03)

```typescript
// src/app/actions/generate.ts
"use server";

import { generateScript } from "@/lib/agent";
import { getDb } from "@/lib/db";
import { scripts, beats } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function generateNewScript(formData: FormData) {
  const format = formData.get("format") as string;
  const devContext = formData.get("devContext") as string;

  if (!format || !devContext) {
    return { error: "Format and dev context are required" };
  }

  const db = getDb();

  // Insert placeholder with "generating" status
  const [script] = db.insert(scripts).values({
    title: "Generating...",
    format,
    status: "generating",
    devContext,
  }).returning();

  try {
    // Call Agent SDK (blocking, no streaming per D-03)
    const output = await generateScript(format, devContext);

    // Update script with generated data
    db.update(scripts)
      .set({
        title: output.titles[0],
        hooks: output.hooks,
        titles: output.titles,
        thumbnail: output.thumbnail,
        durationEstimate: output.duration_estimate,
        antiSlopScore: output.anti_slop_score,
        status: "draft",
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, script.id))
      .run();

    // Insert beats as separate rows
    const beatValues = output.beats.map((beat, index) => ({
      scriptId: script.id,
      order: index + 1,
      visual: beat.visual,
      voiceover: beat.voiceover,
      duration: beat.duration ?? null,
    }));

    if (beatValues.length > 0) {
      db.insert(beats).values(beatValues).run();
    }

    revalidatePath("/");
    return { success: true, scriptId: script.id };

  } catch (error) {
    // Update status to reflect error
    db.update(scripts)
      .set({ status: "draft", title: "Generation failed" })
      .where(eq(scripts.id, script.id))
      .run();

    return {
      error: error instanceof Error ? error.message : "Generation failed"
    };
  }
}
```

### Anti-Patterns to Avoid

- **Parsing markdown output manually:** The Agent SDK supports `outputFormat` with JSON schema. Do not parse markdown tables to extract beats, hooks, and scores. Use structured output.
- **Setting ANTHROPIC_API_KEY alongside Max subscription auth:** If `ANTHROPIC_API_KEY` is set, Claude Code switches to per-token API billing. For Max subscription usage, ensure the env var is NOT set.
- **Building the web app in the project root:** Next.js generates many files (node_modules, .next/, public/) that would clutter the project root alongside CLAUDE.md, scripts/, and .claude/. Use a `web/` subfolder.
- **Using `settingSources: []` (default):** The default is no settings loaded. You MUST include `"project"` to load CLAUDE.md and skills from the working directory.
- **Storing beats as JSON column on the scripts table:** D-07 explicitly requires structured beats. Use a separate `beats` table for Phase 5 editing capabilities.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI response parsing | Markdown/regex parser for dual-track tables | Agent SDK `outputFormat` with JSON schema | SDK validates output matches schema; retries if malformed |
| UI components | Custom buttons, inputs, selects, cards | shadcn/ui v4 `npx shadcn@latest add` | Copy-paste Radix primitives; accessible; Tailwind v4 native |
| Database migrations | Manual SQL scripts | `drizzle-kit push` (dev) / `drizzle-kit migrate` (prod) | Schema-as-code, type-safe, tracks changes |
| Form validation | Manual if/else checks | Zod schemas + Server Action validation | Same schemas used for Agent SDK output and form input |
| Toast notifications | Custom toast component | `sonner` via shadcn/ui | Comes with shadcn/ui init; handles stacking, animation |

## Common Pitfalls

### Pitfall 1: Agent SDK Auth Confusion (Max vs API Key)

**What goes wrong:** D-01 says "uses Max subscription -- zero additional API cost." But the official Agent SDK docs state: "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Please use the API key authentication methods described in this document instead."

**Why it happens:** The Agent SDK in non-bare mode CAN read OAuth tokens from the system keychain (from `claude` CLI login). This technically works for personal use. But Anthropic's official guidance is to use `ANTHROPIC_API_KEY`. The PITFALLS.md research found Anthropic actively blocked OAuth usage in third-party apps in Feb 2026.

**How to avoid:** For a personal local tool (not distributed to third parties), running with `settingSources: ["project"]` without `--bare` mode should use the existing keychain auth from Pavlo's Max subscription. This is the same mechanism Claude Code itself uses. The SDK spawns Claude Code as a subprocess, which authenticates the same way as interactive Claude Code. However, if this fails or rate-limits appear, the fallback is to provision an API key (~$0.08/month for this usage volume).

**Warning signs:** `authentication_failed` error in SDKAssistantMessage; `billing_error` in result message; unexpected charges on Anthropic Console.

### Pitfall 2: better-sqlite3 Fails to Install on Windows

**What goes wrong:** `npm install better-sqlite3` fails with node-gyp compilation errors because prebuilt binaries are NOT available for Windows.

**Why it happens:** better-sqlite3 always compiles from source on Windows. It requires Python 3.x and Visual Studio Build Tools.

**How to avoid:** Pavlo's machine has both requirements: Python 3.13.12 and Visual Studio 2022. The install should work. If it fails: (1) run `npm config set msvs_version 2022`, (2) ensure Python is in PATH, (3) as last resort, use `sql.js` (pure JS SQLite, no native deps).

**Warning signs:** `gyp ERR!` in npm install output; `node-gyp rebuild` failures.

### Pitfall 3: Agent SDK cwd Must Point to Project Root

**What goes wrong:** Agent SDK spawns Claude Code in the wrong directory. It cannot find CLAUDE.md, skills, or reference files. The devlog-scriptwriter skill never activates.

**Why it happens:** The `web/` subfolder is the Next.js working directory. But `.claude/skills/` and `CLAUDE.md` live in the project root. If `cwd` is not set (defaults to `process.cwd()` which is `web/`), Claude Code starts in the wrong place.

**How to avoid:** Always set `cwd` in the Agent SDK options to the project root: `cwd: path.resolve(process.cwd(), "..")` or use an absolute path. The `systemPrompt` must include `{ type: "preset", preset: "claude_code" }` and `settingSources: ["project"]` must be set to load skills from the project directory.

### Pitfall 4: Drizzle Schema JSON Column Type Safety

**What goes wrong:** JSON columns in Drizzle return `unknown` type at runtime. Accessing `script.hooks[0].variant` fails with TypeScript errors or runtime crashes.

**Why it happens:** Drizzle's `text("col", { mode: "json" })` stores/retrieves JSON but defaults to `unknown` type. You need the `.$type<T>()` modifier to get type safety.

**How to avoid:** Always chain `.$type<YourType>()` after `{ mode: "json" }` columns:
```typescript
hooks: text("hooks", { mode: "json" }).$type<HookVariant[]>(),
```

### Pitfall 5: Agent SDK Generation Takes 30-60 Seconds

**What goes wrong:** User clicks "Generate" and sees nothing for a long time. Since D-03 locks no-streaming, the entire generation runs before any response.

**Why it happens:** The Agent SDK spawns Claude Code, which loads skills, reads reference files, generates the script, self-scores anti-slop, rewrites if below 35/50, and returns structured output. This is an agentic loop with multiple turns.

**How to avoid:** Display a clear loading state with: (1) an animated indicator (skeleton/spinner), (2) elapsed time counter, (3) disable the form during generation, (4) the `status: "generating"` record in the database so navigation does not lose the in-progress generation. Consider a `maxTurns: 5` limit and `maxBudgetUsd: 0.50` to prevent runaway costs.

### Pitfall 6: Next.js 16 Async Request APIs

**What goes wrong:** Code that worked in Next.js 15 breaks because `cookies()`, `headers()`, and route `params` are now async and must be `await`ed.

**Why it happens:** Next.js 16 enforces async request APIs. The compatibility layer from 15.x is removed.

**How to avoid:** Always `await` these APIs:
```typescript
// Next.js 16 (correct)
const cookieStore = await cookies();
const { id } = await params;
```

## Code Examples

### shadcn/ui v4 Setup with Next.js 16

```bash
# From web/ directory after create-next-app
npx shadcn@latest init

# Select: New York style, Zinc base color, CSS variables: yes
# This creates components.json and src/components/ui/

# Add components needed for Phase 4
npx shadcn@latest add button card input textarea select badge separator
```

The shadcn CLI v4 automatically detects Tailwind v4 and configures OKLCH color tokens in `src/app/globals.css` via the `@theme` directive.

### Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/scripts.db",
  },
});
```

```bash
# Push schema to database (dev workflow)
npx drizzle-kit push

# Generate migration SQL (for tracking changes)
npx drizzle-kit generate
```

### Generation Form Component (GENR-01)

```typescript
// src/components/generate-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateNewScript } from "@/app/actions/generate";
import type { VideoFormat } from "@/lib/references";

interface GenerateFormProps {
  formats: VideoFormat[];
}

export function GenerateForm({ formats }: GenerateFormProps) {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!selectedFormat) return;
    formData.set("format", selectedFormat);
    setIsGenerating(true);
    try {
      const result = await generateNewScript(formData);
      if (result.error) {
        // Show error toast
      } else {
        // Navigate to script or show success
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Format selector: 7 cards in a grid */}
      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => (
          <Card
            key={format.slug}
            className={`cursor-pointer transition-colors ${
              selectedFormat === format.slug
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground/30"
            }`}
            onClick={() => setSelectedFormat(format.slug)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">{format.name}</CardTitle>
              <CardDescription className="text-xs">
                {format.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Dev context input */}
      <Textarea
        name="devContext"
        placeholder="What did you work on this week? Be specific: bugs, features, numbers, tools..."
        className="mt-4 min-h-[120px]"
        disabled={isGenerating}
      />

      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={!selectedFormat || isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Script"}
      </Button>
    </form>
  );
}
```

### Agent SDK Result Handling

```typescript
// Collecting the result from the async generator
for await (const message of query({ prompt, options })) {
  switch (message.type) {
    case "system":
      // Init message -- contains session_id, model, tools, skills loaded
      if (message.subtype === "init") {
        console.log("Skills loaded:", message.skills);
        console.log("Model:", message.model);
      }
      break;

    case "assistant":
      // Claude's reasoning (optional: log for debugging)
      if (message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) {
            // Claude's thinking text (not shown to user)
          }
        }
      }
      break;

    case "result":
      if (message.subtype === "success") {
        // structured_output contains the JSON matching outputFormat schema
        const output = message.structured_output;
        // total_cost_usd shows actual cost
        console.log(`Cost: $${message.total_cost_usd}`);
        console.log(`Turns: ${message.num_turns}`);
      } else {
        // error_max_turns, error_during_execution,
        // error_max_budget_usd, error_max_structured_output_retries
        console.error(`Failed: ${message.subtype}`, message.errors);
      }
      break;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@anthropic-ai/claude-code-sdk` | `@anthropic-ai/claude-agent-sdk` | 2026 (rename) | Same API, new package name |
| `claude -p` subprocess | Agent SDK `query()` | 2025-2026 | Type-safe, structured output, no manual process management |
| `settingSources` defaults to all | Defaults to `[]` (none) | SDK 0.1.x | Must explicitly include `["project"]` to load CLAUDE.md/skills |
| Markdown output parsing | `outputFormat` with JSON schema | Agent SDK feature | Eliminates fragile regex parsing |
| Tailwind v3 with `tailwind.config.js` | Tailwind v4 with `@theme` in CSS | 2025 | No config file; `@theme` directive in globals.css |
| shadcn/ui v3 CLI | shadcn CLI v4 | March 2026 | Auto-detects Tailwind v4, OKLCH colors, React 19 |
| better-sqlite3 11.x | better-sqlite3 12.8.0 | 2025 | Requires Node 20+ (was 18+) |

## Open Questions

1. **Max subscription auth for personal SDK use**
   - What we know: Agent SDK in non-bare mode reads OAuth from keychain. Official docs say "use API key." PITFALLS.md says Anthropic banned OAuth in third-party apps Feb 2026.
   - What's unclear: Does "third-party app" include a personal localhost tool that Pavlo built for himself? The Agent SDK spawns Claude Code (an Anthropic product) -- is this different from a proxy?
   - Recommendation: Try keychain auth first (matches D-01). If it fails or causes issues, provision an API key as fallback. The cost is ~$0.08/month.

2. **Agent SDK subprocess on Windows**
   - What we know: The SDK spawns a Claude Code subprocess. Claude Code works on Windows (Pavlo uses it daily in WezTerm).
   - What's unclear: Whether `query()` handles Windows paths and process spawning correctly when called from a Next.js dev server.
   - Recommendation: Test early in implementation. If process spawning fails, try setting `pathToClaudeCodeExecutable` explicitly.

3. **Agent SDK response time**
   - What we know: The agentic loop (load skill, read references, generate, score, rewrite if < 35) takes multiple turns. D-03 says no streaming.
   - What's unclear: Exact latency. Could be 15-60 seconds depending on skill complexity and self-scoring iterations.
   - Recommendation: Implement the generation as a Server Action with `status: "generating"` in the database. Display elapsed time. Set `maxTurns: 5` to bound response time.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | 24.14.0 | -- |
| npm | Package management | Yes | 11.9.0 | -- |
| Python 3.x | better-sqlite3 native build (node-gyp) | Yes | 3.13.12 | -- |
| Visual Studio 2022 | better-sqlite3 native build (node-gyp) | Yes | 2022 | -- |
| Claude Code CLI | Agent SDK subprocess | Yes (Pavlo uses daily) | -- | -- |
| Claude Max subscription | Agent SDK auth | Yes (active) | -- | Anthropic API key ($0.08/mo) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None -- all required tools are available.

## Sources

### Primary (HIGH confidence)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- `query()` function, Options type, full API (fetched and verified)
- [Agent SDK Quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart) -- installation, auth, basic usage
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) -- capabilities, auth note about third-party apps
- [Agent SDK Structured Outputs](https://platform.claude.com/docs/en/agent-sdk/structured-outputs) -- `outputFormat`, JSON schema, Zod integration, error handling
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless) -- CLI flags, bare mode, streaming, `settingSources`
- npm registry: `@anthropic-ai/claude-agent-sdk@0.2.86`, `drizzle-orm@0.45.2`, `better-sqlite3@12.8.0`, `next@16.2.1`, `shadcn@4.1.1`

### Secondary (MEDIUM confidence)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) -- v4 setup with `@theme` directive
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) -- project setup steps
- [better-sqlite3 Windows prebuilt binaries issue #355](https://github.com/WiseLibs/better-sqlite3/issues/355) -- confirmed no Windows prebuilts
- [Drizzle ORM node:sqlite issue #5471](https://github.com/drizzle-team/drizzle-orm/issues/5471) -- drizzle-kit does not fully support node:sqlite

### Tertiary (LOW confidence)
- Anthropic ToS enforcement on OAuth (The Register, WinBuzzer, Feb 2026) -- referenced in PITFALLS.md; applicability to personal localhost tools is unclear

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH -- Agent SDK API verified against official docs; schema patterns are standard Drizzle
- Pitfalls: MEDIUM-HIGH -- auth question unresolved for personal use; Windows native build confirmed feasible

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable stack, 30-day window)
