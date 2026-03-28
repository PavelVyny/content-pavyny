# Phase 5: Script Editor - Research

**Researched:** 2026-03-28
**Domain:** Interactive beat editor — click-to-edit, single-beat regeneration, hook variant switching, anti-slop rescoring
**Confidence:** HIGH

## Summary

Phase 5 adds interactivity to the existing read-only script display. The core challenge is building a Notion-style click-to-edit beat editor with server actions for persistence, a tab-based hook variant switcher, single-beat AI regeneration, and a manual rescore workflow. All building blocks exist in the codebase: shadcn/ui components (Card, Textarea, Badge, Button), Drizzle ORM schema with separate beats table, Agent SDK integration in `lib/agent.ts`, and the anti-slop scoring rubric in reference files.

The phase creates a new dynamic route at `/script/[id]` with a server component page that fetches the script and passes it to a client-side editor component. Five new server actions handle mutations: `updateBeat`, `updateHook`, `selectHook`, `regenerateBeat`, and `rescoreScript`. The existing `ScriptDisplay` component on the generation page (`/`) remains read-only.

**Primary recommendation:** Build the editor as a single client component (`ScriptEditor`) that receives the full script with beats from the server component page. Use inline server action calls with `useTransition` for non-blocking saves. Textarea with `field-sizing-content` (already in the project's Textarea component) handles auto-height. Tabs component (shadcn/ui or custom) handles hook variant switching.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Click-to-edit -- beat text displays as normal text, clicking switches that field to a textarea. Save on blur (no save button). Notion-style.
- **D-02:** Editor lives on a separate page at `/script/[id]`. Generation page (`/`) stays simple. Phase 6 library will link directly to editor.
- **D-03:** Each beat card has a small icon button (refresh/sparkle) in the top-right corner for regeneration. Always visible, not hover-only.
- **D-04:** When regenerating a single beat, AI receives full script context (all beats + dev context + format) to ensure the regenerated beat fits the flow.
- **D-05:** Tab bar (A / B / C) above the beats list. Switching tabs shows that variant's visual+voiceover content. Instant switching, no page reload.
- **D-06:** Hooks stay separate from the beats list -- they are NOT beat #1. Hook section sits above the beats section in the editor layout.
- **D-07:** Hook variant content is also click-to-edit (same interaction as beat editing). Edits to hook text save on blur.
- **D-08:** Manual rescore -- a "Rescore" button next to the score panel. Score shows a "stale" indicator after any beat or hook text is edited. Avoids constant AI calls during editing.
- **D-09:** Score panel scrolls with the page (not sticky sidebar). Simple single-column layout.

### Claude's Discretion
- Loading state during single-beat regeneration (spinner, skeleton, etc.)
- Error handling for failed regeneration or rescoring
- Visual feedback for click-to-edit transitions (border, background change)
- Textarea auto-height behavior
- Server action design for `updateBeat`, `regenerateBeat`, `rescoreScript`, `updateHook`, `selectHook`
- Exact layout proportions and spacing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | Dual-track beat editor -- visual and voiceover as separate editable blocks per beat, clean readable layout | Existing `ScriptDisplay` already renders grid-cols-2 for visual/voiceover. Editor mirrors this layout but replaces `<p>` with click-to-edit fields. Textarea component with `field-sizing-content` handles auto-height. |
| EDIT-02 | Inline editing -- click any beat segment to edit text directly | Click-to-edit pattern: React state tracks which field is being edited (e.g., `editingField: {beatId, field}` or `null`). On click, render Textarea; on blur, call `updateBeat` server action and clear editing state. |
| EDIT-03 | Hook variant selector -- UI to switch between 2-3 generated hook variants | Hooks stored as JSON array in scripts table. Tab bar (A/B/C) controls `selectedHook` state. `selectHook` server action persists selection. Hook content is click-to-edit with `updateHook` server action. |
| EDIT-04 | Quick beat re-generate -- re-generate a single beat without regenerating the whole script | New `regenerateBeat` server action sends full script context + target beat order to Agent SDK. Returns replacement beat text. Other beats remain untouched in DB. |
| EDIT-05 | Anti-slop score display -- 5 dimensions table with total score, updates on edit | Existing score panel in `ScriptDisplay` renders the 5-dimension grid. Editor adds "stale" badge after edits and "Rescore" button. `rescoreScript` server action sends all current text to Agent SDK for re-scoring. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | App Router, server components, server actions | Already in project |
| React | 19.2.4 | Client interactivity, `useTransition`, `useState` | Already in project |
| shadcn/ui | v4.1.1 | Card, Badge, Button, Textarea, Separator components | Already in project |
| Drizzle ORM | 0.45.2 | Database queries for beat/script updates | Already in project |
| better-sqlite3 | 12.8.0 | SQLite driver | Already in project |
| lucide-react | 1.7.0 | Icons (RefreshCw or Sparkles for regenerate button) | Already in project |
| @anthropic-ai/claude-agent-sdk | 0.2.86 | AI calls for beat regeneration and rescoring | Already in project |

### New Components to Add
| Component | Source | Purpose | How to Add |
|-----------|--------|---------|------------|
| Tabs | shadcn/ui | Hook variant A/B/C tab bar (D-05) | `npx shadcn@latest add tabs` |

No new npm packages required. All dependencies are already installed.

**Tabs installation:**
```bash
cd web && npx shadcn@latest add tabs
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Tabs | Custom div+button tabs | shadcn Tabs gives accessible keyboard nav and ARIA for free; custom is lighter but reinvents a11y |
| field-sizing-content (CSS) | JS auto-resize (scrollHeight) | CSS `field-sizing-content` is already in the project's Textarea, works in all modern browsers, zero JS overhead |
| useTransition for saves | useOptimistic | useOptimistic would show instant text but adds complexity; blur-save with useTransition is simpler and matches Notion-style feel |

## Architecture Patterns

### New Files / Route Structure
```
web/src/
├── app/
│   ├── script/
│   │   └── [id]/
│   │       └── page.tsx          # Server component — fetch script + beats, render ScriptEditor
│   └── actions/
│       └── editor.ts             # Server actions: updateBeat, updateHook, selectHook, regenerateBeat, rescoreScript
├── components/
│   ├── script-editor.tsx         # Main client component — beat list, hook tabs, score panel
│   ├── editable-beat.tsx         # Single beat card with click-to-edit visual+voiceover
│   ├── hook-section.tsx          # Hook tab bar + editable hook content
│   ├── score-panel.tsx           # Anti-slop score display with stale indicator + rescore button
│   └── ui/
│       └── tabs.tsx              # shadcn Tabs component (to be added)
└── lib/
    └── agent.ts                  # Add regenerateBeatText() and rescoreScriptText() functions
```

### Pattern 1: Dynamic Route Server Component
**What:** `/script/[id]/page.tsx` is a server component that fetches the script and its beats from SQLite, then renders the client-side `ScriptEditor`.
**When to use:** Every time the editor page is loaded or revalidated.

**IMPORTANT (Next.js 16):** The `params` prop is a `Promise` in Next.js 16. Must `await` it.
```typescript
// app/script/[id]/page.tsx
export default async function ScriptEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scriptId = parseInt(id, 10);
  // fetch script + beats from DB, pass to <ScriptEditor />
}
```

### Pattern 2: Click-to-Edit Field
**What:** Text displays as `<p>`, clicking switches to `<Textarea>`, blur saves and switches back.
**When to use:** Every visual and voiceover field in beats and hooks.
```typescript
// Simplified click-to-edit pattern
const [editing, setEditing] = useState(false);
const [value, setValue] = useState(initialValue);

if (editing) {
  return (
    <Textarea
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (value !== initialValue) {
          startTransition(() => updateBeat(beatId, field, value));
        }
      }}
    />
  );
}
return <p onClick={() => setEditing(true)}>{value}</p>;
```

### Pattern 3: Server Actions for Mutations
**What:** All data mutations go through server actions in `app/actions/editor.ts`. Each action uses Drizzle ORM, calls `revalidatePath`, and returns a typed result.
**When to use:** updateBeat, updateHook, selectHook, regenerateBeat, rescoreScript.
```typescript
// app/actions/editor.ts
"use server";
import { getDb } from "@/lib/db";
import { beats, scripts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateBeat(
  beatId: number,
  field: "visual" | "voiceover",
  value: string
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(beats)
    .set({ [field]: value })
    .where(eq(beats.id, beatId))
    .run();
  // revalidatePath not strictly needed for optimistic client state,
  // but ensures consistency on next server render
  revalidatePath("/script/[id]", "page");
  return { success: true };
}
```

### Pattern 4: Stale Score Indicator
**What:** Track whether any beat or hook text has changed since last score calculation. Show "stale" badge on score panel.
**When to use:** After any text edit (beat or hook), flip a `isScoreStale` state to true. Reset to false after successful rescore.
```typescript
const [isScoreStale, setIsScoreStale] = useState(false);
// In any onBlur handler that modifies text:
setIsScoreStale(true);
// After rescoreScript completes:
setIsScoreStale(false);
```

### Pattern 5: Single Beat Regeneration with Full Context
**What:** When regenerating one beat, send ALL beats + hooks + dev context + format to the AI, specifying which beat to regenerate.
**When to use:** EDIT-04 requirement. The AI needs surrounding context to produce a coherent replacement.
```typescript
// In agent.ts — new function
export async function regenerateBeatText(
  format: string,
  devContext: string,
  allBeats: { order: number; visual: string; voiceover: string }[],
  hooks: { variant: string; visual: string; voiceover: string }[],
  targetBeatOrder: number
): Promise<{ visual: string; voiceover: string }> {
  // Build prompt with full script context, ask AI to regenerate only beat #targetBeatOrder
  // Return just the replacement visual+voiceover
}
```

### Anti-Patterns to Avoid
- **Saving on every keystroke:** Do NOT debounce-save while typing. Save ONLY on blur (D-01 decision). This avoids excessive server calls and partial-word saves.
- **Separate save button:** Explicitly rejected in D-01. Blur is the save trigger.
- **Making hooks beat #1:** D-06 explicitly says hooks are NOT part of the beats list. They sit above in their own section.
- **Auto-rescore on edit:** D-08 explicitly says manual rescore only. Show stale indicator, user clicks "Rescore" when ready.
- **Sticky/fixed score panel:** D-09 says score panel scrolls with the page, not sticky.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab component with a11y | Custom div+onClick tabs | shadcn/ui Tabs (`npx shadcn@latest add tabs`) | Keyboard navigation, ARIA roles, focus management handled automatically |
| Auto-resizing textarea | JS scrollHeight calculation | CSS `field-sizing-content` (already in Textarea component) | Zero JS, native browser behavior, already works in the project |
| Icon library | SVG strings or custom icon components | lucide-react (already installed) | RefreshCw, Sparkles, AlertCircle, etc. all available |
| Toast notifications | Custom alert/banner | sonner (already installed via shadcn) | Used for save confirmations, error messages, regeneration results |

**Key insight:** Everything needed is already in the project. This phase is pure composition of existing components with new interactivity, plus two new Agent SDK functions for beat regeneration and rescoring.

## Common Pitfalls

### Pitfall 1: Next.js 16 params is a Promise
**What goes wrong:** Destructuring `params` directly without `await` causes a runtime error.
**Why it happens:** Next.js 16 changed `params` to async (breaking change from 15).
**How to avoid:** Always `const { id } = await params;` in server components. In client components, use `use(params)`.
**Warning signs:** Build error or runtime "params is not iterable" error.

### Pitfall 2: Blur fires before button click
**What goes wrong:** If the regenerate button is clicked while a textarea is focused, blur fires first (triggering save), then the click may not register because the DOM re-renders.
**How to avoid:** Use `onMouseDown` with `preventDefault()` on the regenerate button to prevent blur from firing, OR delay the editing state change slightly. Alternatively, use `relatedTarget` in the blur handler to check if focus moved to a button.
**Warning signs:** Regenerate button seems unresponsive when a field is being edited.

### Pitfall 3: Stale state after regeneration
**What goes wrong:** After `regenerateBeat` returns new text from the server, the client component still shows old text if state is not properly updated.
**Why it happens:** Server action calls `revalidatePath` but the client component holds local state that does not automatically sync.
**How to avoid:** After server action completes, update local state directly with the returned values. Do NOT rely solely on `revalidatePath` for client-side state updates in interactive components.
**Warning signs:** Old text showing after regeneration until page refresh.

### Pitfall 4: Race conditions on rapid edits
**What goes wrong:** Editing beat 1 visual, immediately clicking beat 2 voiceover -- blur on beat 1 triggers save, but edit state flips to beat 2 before save completes.
**How to avoid:** Use `useTransition` for saves so they don't block UI. The `isPending` state can optionally show a subtle saving indicator. Each field's state is independent.
**Warning signs:** Lost edits, flickering text.

### Pitfall 5: Agent SDK cost on regeneration
**What goes wrong:** Each `regenerateBeat` call spawns a Claude Code subprocess which costs ~$0.02-0.08 per call. Rapid regeneration clicks accumulate cost.
**Why it happens:** Agent SDK uses Pavlo's Max subscription, but still has usage implications.
**How to avoid:** Show loading state during regeneration (D-03 icon becomes a spinner). Disable the regenerate button while a regeneration is in progress for that beat.
**Warning signs:** Multiple concurrent Agent SDK processes.

## Code Examples

### Server Action: updateBeat
```typescript
// app/actions/editor.ts
"use server";
import { getDb } from "@/lib/db";
import { beats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateBeat(
  beatId: number,
  field: "visual" | "voiceover",
  value: string
): Promise<void> {
  const db = getDb();
  db.update(beats)
    .set({ [field]: value })
    .where(eq(beats.id, beatId))
    .run();
}
```

### Server Action: selectHook
```typescript
export async function selectHook(
  scriptId: number,
  variant: string // "A", "B", or "C"
): Promise<void> {
  const db = getDb();
  db.update(scripts)
    .set({ selectedHook: variant, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .run();
}
```

### Server Action: updateHook
```typescript
export async function updateHook(
  scriptId: number,
  variant: string,
  field: "visual" | "voiceover",
  value: string
): Promise<void> {
  const db = getDb();
  // Hooks are stored as JSON array in scripts.hooks
  const script = db.select().from(scripts).where(eq(scripts.id, scriptId)).get();
  if (!script || !script.hooks) return;

  const hooks = script.hooks as { variant: string; visual: string; voiceover: string }[];
  const hookIndex = hooks.findIndex((h) => h.variant === variant);
  if (hookIndex === -1) return;

  hooks[hookIndex] = { ...hooks[hookIndex], [field]: value };
  db.update(scripts)
    .set({ hooks, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .run();
}
```

### Agent function: regenerateBeatText (sketch)
```typescript
// lib/agent.ts — add alongside existing generateScript
export async function regenerateBeatText(
  format: string,
  devContext: string,
  allBeats: { order: number; visual: string; voiceover: string }[],
  hooks: { variant: string; visual: string; voiceover: string }[],
  targetBeatOrder: number
): Promise<{ visual: string; voiceover: string }> {
  const brandVoice = loadRef("brand-voice.md");
  const antiSlop = loadRef("anti-slop-rules.md");

  const beatsContext = allBeats
    .map((b) => `Beat #${b.order}: Visual: ${b.visual} | Voiceover: ${b.voiceover}`)
    .join("\n");

  const prompt = `You are the devlog-scriptwriter. Given the full script context below, regenerate ONLY beat #${targetBeatOrder}.
The new beat must fit the flow of surrounding beats, match brand voice, and pass anti-slop rules.

=== FULL SCRIPT ===
Format: ${format}
Dev context: ${devContext}

Hooks:
${hooks.map((h) => `${h.variant}: Visual: ${h.visual} | Voiceover: ${h.voiceover}`).join("\n")}

Beats:
${beatsContext}

=== BRAND VOICE ===
${brandVoice}

=== ANTI-SLOP RULES ===
${antiSlop}

Respond with ONLY a JSON object: { "visual": "...", "voiceover": "..." }
Generate a fresh take on beat #${targetBeatOrder}. Keep the same topic/moment but find a different angle or phrasing.`;

  // Use same Agent SDK query pattern as generateScript...
}
```

### Agent function: rescoreScriptText (sketch)
```typescript
export async function rescoreScriptText(
  allBeats: { visual: string; voiceover: string }[],
  hooks: { variant: string; visual: string; voiceover: string }[],
  selectedHook: string
): Promise<AntiSlopScore> {
  const antiSlop = loadRef("anti-slop-rules.md");
  const brandVoice = loadRef("brand-voice.md");

  const selectedHookContent = hooks.find((h) => h.variant === selectedHook);
  const fullScript = [
    selectedHookContent ? `Hook: ${selectedHookContent.voiceover}` : "",
    ...allBeats.map((b) => b.voiceover),
  ].join("\n");

  const prompt = `Score this devlog script on 5 anti-slop dimensions (1-10 each).
...
Respond with ONLY JSON: { "directness": N, "rhythm": N, "trust": N, "authenticity": N, "density": N, "total": N, "notes": "..." }`;

  // Use same Agent SDK query pattern...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params: { id: string }` (sync) | `params: Promise<{ id: string }>` (async) | Next.js 15+ | Must await params in server components, use `use()` in client components |
| `"use server"` at function level | `"use server"` at file top | Next.js 13+ stable | Both work; file-level is the convention in this project (see `generate.ts`) |
| JS textarea auto-resize | CSS `field-sizing-content` | 2024 browser support | Already used in project's Textarea component |

## Open Questions

1. **Tabs component availability in shadcn v4**
   - What we know: shadcn/ui v4 has Tabs in its registry. The project uses `@base-ui/react` as the headless layer.
   - What's unclear: Whether `npx shadcn@latest add tabs` works cleanly with the current setup.
   - Recommendation: Try adding it. If it fails, build a simple custom tab bar with `<button>` elements and active state styling -- it is only 3 tabs (A/B/C) and the logic is trivial.

2. **Navigation to editor from generation page**
   - What we know: D-02 says editor is at `/script/[id]`. Generation page stays simple.
   - What's unclear: How does Pavlo navigate from generation page to editor? Phase 6 library will link, but for Phase 5 alone.
   - Recommendation: Add an "Edit" button/link on the `ScriptDisplay` component that navigates to `/script/{id}`. This is a minimal, natural addition.

## Project Constraints (from CLAUDE.md)

- **Anti-slop is top priority.** Every script must pass 35+/50 scoring. Rescoring must use the same rubric.
- **Visuals-first.** Editor layout must reinforce dual-track visual/voiceover structure.
- **One idea per video.** Editor does not change this constraint -- it is enforced at generation time.
- **Pronunciation-friendly.** Scripts must avoid complex English constructions (relevant for rescoring).
- **Communicate with Pavlo in Russian.** Scripts for videos in English.
- **GSD Workflow Enforcement.** Before using Edit, Write, or other file-changing tools, start work through a GSD command.
- **Next.js 16 docs.** Read `web/node_modules/next/dist/docs/` before writing code (per web/AGENTS.md).
- **Use frontend-design skill** for any UI/UX work (D-09 from Phase 4).

## Sources

### Primary (HIGH confidence)
- `web/src/components/script-display.tsx` -- existing beat rendering pattern, score panel, hook display
- `web/src/lib/types.ts` -- Script, ScriptBeat, HookVariant, AntiSlopScore interfaces
- `web/src/lib/db/schema.ts` -- Drizzle schema with scripts + beats tables
- `web/src/app/actions/generate.ts` -- existing server action patterns (Drizzle, revalidatePath, typed results)
- `web/src/lib/agent.ts` -- existing Agent SDK integration pattern
- `web/src/components/ui/textarea.tsx` -- Textarea with field-sizing-content
- `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` -- Next.js 16 dynamic route params (Promise)
- `web/node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` -- Server Functions / Server Actions pattern

### Secondary (MEDIUM confidence)
- `.planning/phases/05-script-editor/05-CONTEXT.md` -- all locked decisions (D-01 through D-09)
- `.planning/phases/04-foundation-generation/04-CONTEXT.md` -- stack decisions, design choices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, no new packages needed (except shadcn Tabs component)
- Architecture: HIGH -- patterns follow exactly what Phase 4 established, extending with new route + server actions
- Pitfalls: HIGH -- identified from direct code inspection (blur/click race, params Promise, stale state after regeneration)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no moving targets, all deps already locked)
