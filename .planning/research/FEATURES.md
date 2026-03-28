# Feature Research

**Domain:** Web UI for AI-assisted devlog scriptwriting (YouTube Shorts)
**Researched:** 2026-03-27
**Confidence:** MEDIUM-HIGH

This research focuses on what features a **web interface** needs for the existing CLI-based scriptwriting pipeline. The CLI already handles: ideation (5-7 angles), script generation (dual-track, hooks, anti-slop), metrics analysis, brand voice, and anti-slop rules. This milestone wraps that pipeline in a local web app.

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any web-based scriptwriting interface needs. Without these, the web UI is worse than the CLI.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Script generation form** | Core purpose of the app. Format selector + context textarea + "Generate" button. Must be faster than typing a CLI command. | LOW | Dropdown/card picker for 7 script formats (The Bug, The Satisfaction, Before/After, etc.). Context field for "what I worked on." One-click generation. |
| **Visual dual-track script display** | The CLI outputs interleaved visual/voiceover text. Web UI must render this as two clear tracks side-by-side or stacked blocks. This is the primary reason to build a UI. | MEDIUM | Each beat = a block with two lanes: left = screen direction (what viewer sees), right = voiceover text. Color-coded. The visual lane and audio lane must be visually distinct. |
| **Inline script editing** | Generated scripts always need human polish. Click any text to edit in-place. No separate "edit mode" -- text is always editable. | LOW | Standard contenteditable or rich text editor on each block. Markdown not needed -- scripts are plain text with simple structure. |
| **Anti-slop score display** | The CLI scores scripts 35+/50. UI must show this score prominently with a pass/fail indicator. Without visible scoring, the user loses the quality gate. | LOW | Score badge (e.g., "42/50") with color: red (<35), yellow (35-42), green (43+). Show breakdown of 5 dimensions (vocabulary, structure, specificity, rhythm, authenticity) as sub-scores. |
| **Script library (list view)** | Scripts accumulate. Need to browse past scripts, see their format/date/score at a glance. A flat list with basic metadata. | LOW | Table or card list: title, format type, date created, anti-slop score, status (draft/final/recorded). Sorted by date descending. |
| **Script persistence (save/load)** | Scripts must survive page refresh. Local database storage. Auto-save on edit. | LOW | SQLite or JSON file storage. Auto-save with debounce on every edit. No manual "save" button needed. |
| **Hook section prominence** | First 3 seconds are the most important part. UI must visually emphasize the hook block -- larger, highlighted, or pinned at top. | LOW | First beat/block gets a distinct visual treatment: accent border, "HOOK" label, slightly larger text. Separates hook from body visually. |
| **Copy-to-clipboard** | After editing, user needs to get the final script text out. One-click copy of the voiceover track only (what Pavlo reads during recording). | LOW | "Copy script" button that extracts only the voiceover text, formatted for reading (no visual directions). Also option to copy full dual-track. |
| **Responsive layout** | Pavlo uses both Windows PC and MacBook. UI must work on different screen sizes. | LOW | Standard responsive design. Desktop-first (primary use case is at the workstation where recording happens). Mobile not needed -- Pavlo records at his desk. |

### Differentiators (Competitive Advantage)

Features that make this web UI genuinely better than the CLI or than generic AI writing tools. These are what justify building a custom app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Anti-slop inline highlighting** | Grammarly-style: flagged words/phrases get colored underlines in the editor. Hover to see why it was flagged and a suggested replacement. This is the killer feature -- no other scriptwriting tool does anti-slop inline. | MEDIUM | Map 90+ banned phrases to regex patterns. Run on script text, highlight matches with red/orange underlines. Tooltip shows: "AI slop detected: 'game-changer' -- try a specific description instead." Clicking suggestion replaces inline. |
| **Beat-block editor (drag-and-drop)** | Script beats as draggable blocks (like Notion). Reorder beats by dragging. Add/remove beats. Each block = visual direction + voiceover. Structural editing, not just text editing. | HIGH | Notion-style block editor. Each beat is a discrete block. Drag handle on left. Add beat (+) button between blocks. Delete beat (x) on hover. BlockNote or Tiptap for the underlying editor. Complex because it combines block structure with dual-track content per block. |
| **Format template preview** | When selecting a script format, show a visual preview of the beat structure (e.g., "The Bug" = 5 beats: Hook > Setup > Discovery > Fix > Punchline). User sees the skeleton before generating. | LOW | Static preview cards per format. Each card shows the beat names in order. Helps user pick the right format before committing. Could include a mini-example per format. |
| **Script comparison view** | Side-by-side two versions of the same script (e.g., before/after anti-slop rewrite, or two hook variants). Diff-highlighted. | MEDIUM | Split-pane view. Text diffs highlighted in green/red. Useful for hook A/B variants and for reviewing anti-slop rewrites. Not needed for v1 but high value once scripts accumulate. |
| **Score breakdown visualization** | Instead of just "42/50", show a radar chart or bar chart of the 5 anti-slop dimensions. At a glance: "my specificity is always low" becomes visible. | LOW | Five horizontal bars or a small radar chart. Each dimension labeled: Vocabulary (8/10), Structure (9/10), etc. Simple SVG or chart component. |
| **Script search and filter** | Beyond basic list: search by keyword in script text, filter by format type, filter by score range, filter by status. | LOW | Search input + filter dropdowns above the script list. Full-text search on script content. Filter chips for format type. Score range slider. |
| **Generation history / undo** | Track each generation and edit. "Show me the original generated version" vs "my current edited version." | MEDIUM | Store each version (generated, after anti-slop pass, after manual edits) as snapshots. Version selector dropdown. Not full undo -- just discrete snapshots at key moments. |
| **Quick re-generate with tweak** | "Regenerate this script but more casual" or "try a different hook." Modify the generation prompt without starting from scratch. | LOW | "Regenerate" button on each script with an optional text field for adjustment instructions. Keeps the same format and context, adds the tweak as an additional instruction. |
| **Keyboard shortcuts** | Power user feature. Cmd+Enter to generate, Cmd+S to save, Cmd+Shift+C to copy script, Tab to move between beats. | LOW | Standard keyboard shortcut handler. Important because Pavlo is a developer and expects keyboard-driven workflows. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but add complexity without matching Pavlo's actual workflow.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time collaborative editing** | Standard in modern editors (Google Docs, Notion) | Solo creator. Zero use case for collaboration. Adds WebSocket complexity, conflict resolution, auth system. | Single-user app, no auth needed. |
| **WYSIWYG rich text formatting** | Bold, italic, headers, lists seem standard | Scripts are voiceover text -- they get READ ALOUD, not formatted. Rich formatting creates false complexity. The script is spoken words + screen directions. | Plain text editing with structural blocks. Minimal formatting (maybe bold for emphasis during recording). |
| **AI chat sidebar** | ChatGPT/Cursor pattern: chat with AI about the script | Overengineered for the use case. Pavlo needs scripts generated and scored, not a conversation. Chat UI implies open-ended interaction; the pipeline is structured (format + context = script). | Structured form inputs (format picker, context field, tweak field). Specific buttons for specific actions (regenerate, anti-slop pass, hook variants). |
| **Template builder / custom format editor** | Let users create their own script formats | 7 formats were researched and validated. Adding a meta-editor for formats is complex and premature. Pavlo should use the 7 for 20+ videos before custom formats matter. | Hardcode the 7 formats. If Pavlo needs a new one, add it in code -- he's a developer. |
| **Dashboard with analytics charts** | Views, retention, subscriber trends over time | Metrics collection is paused (needs 3+ videos). Building a dashboard before data exists is waste. Manual metrics-log.md works at current volume. | Simple metrics table view. Add charts when there are 15+ data points. |
| **Dark mode / theme system** | Expected in modern apps | Scope creep. Pick one theme and ship. Pavlo can request dark mode later -- it's CSS, not architecture. | Start with dark mode (developer preference, matches terminal aesthetic). No theme switcher. |
| **Export to PDF / Google Docs** | "What if I need to share?" | Sharing is not in the workflow. Scripts go from UI to Pavlo's voice. Copy-to-clipboard is sufficient. | Copy-to-clipboard covers the only export use case. |
| **Prompt engineering UI** | Let user tweak the system prompt, temperature, etc. | Exposes implementation details. The skill and anti-slop rules ARE the prompt engineering, already done. Tweaking prompts per-script will degrade quality. | Hide AI internals. Expose only: format, context, and optional tweak instruction. |
| **Mobile app / PWA** | "Write scripts on the go" | Pavlo writes scripts at his desk where he records. Screen recording workflow is desktop-only. Mobile adds responsive complexity for zero workflow value. | Desktop-only web app. Responsive enough for laptop vs monitor, not for phones. |

## Feature Dependencies

```
Script Generation Form
    |
    +--requires--> Format Templates (must have 7 formats defined)
    |
    +--requires--> AI Backend (Claude API or CLI bridge)
    |
    +--produces--> Script Document (dual-track beats)
                      |
                      +--enables--> Inline Editing (edit the generated script)
                      |
                      +--enables--> Anti-Slop Score Display (score the script)
                      |                 |
                      |                 +--enables--> Anti-Slop Inline Highlighting
                      |                 |              (requires score + flagged phrases)
                      |                 |
                      |                 +--enables--> Score Breakdown Visualization
                      |
                      +--enables--> Copy-to-Clipboard
                      |
                      +--stored-in--> Script Library
                                        |
                                        +--enables--> Script Search & Filter
                                        |
                                        +--enables--> Script Comparison View

Beat-Block Editor (drag-and-drop)
    |
    +--requires--> Script Document model (beats as discrete units)
    |
    +--requires--> Block editor library (BlockNote/Tiptap)
    |
    +--enhances--> Inline Editing (adds structural editing to text editing)

Generation History
    |
    +--requires--> Script Persistence (must store versions)
    |
    +--enhances--> Script Comparison View (compare versions)

Quick Re-generate
    |
    +--requires--> Script Generation Form
    |
    +--requires--> AI Backend
```

### Dependency Notes

- **Anti-Slop Inline Highlighting requires Anti-Slop Score Display:** The highlighting uses the same flagging engine that produces the score. Score must work first, then highlighting visualizes the individual flags.
- **Beat-Block Editor requires a block editor library:** This is the highest-complexity feature. BlockNote or Tiptap are the viable options (see STACK.md). Building custom drag-and-drop is not worth it.
- **Script Comparison View requires Script Persistence:** Can only compare versions if versions are stored. This chains to Generation History.
- **Script Search requires Script Library:** Must have stored scripts before search makes sense. But both are low complexity and can ship together.

## MVP Definition

### Launch With (v1)

Minimum viable web UI -- must be better than the CLI for the core workflow.

- [ ] **Script Generation Form** -- format picker (7 cards) + context textarea + generate button. This is the entry point.
- [ ] **Visual Dual-Track Display** -- render generated script as beat blocks with visual | voiceover lanes. This is why we're building a UI at all.
- [ ] **Inline Script Editing** -- click to edit any text in the dual-track display. No mode switching.
- [ ] **Anti-Slop Score Display** -- score badge with pass/fail color. Dimension breakdown.
- [ ] **Script Persistence** -- auto-save to local DB. Scripts survive refresh.
- [ ] **Script Library (list)** -- browse saved scripts. Title, format, date, score.
- [ ] **Copy-to-Clipboard** -- one-click copy of voiceover text.
- [ ] **Hook Section Prominence** -- visual emphasis on the first beat.

### Add After Validation (v1.x)

Features to add once the core generation-edit-save loop works.

- [ ] **Anti-Slop Inline Highlighting** -- trigger: when users want to fix slop manually instead of re-generating
- [ ] **Format Template Preview** -- trigger: when users hesitate on format selection
- [ ] **Script Search & Filter** -- trigger: when script library exceeds ~15 scripts
- [ ] **Quick Re-generate with Tweak** -- trigger: when users frequently discard full scripts and regenerate
- [ ] **Keyboard Shortcuts** -- trigger: when Pavlo requests faster workflow
- [ ] **Score Breakdown Visualization** -- trigger: when understanding which dimension fails becomes important

### Future Consideration (v2+)

Features to defer until the web UI is proven useful and scripts accumulate.

- [ ] **Beat-Block Editor (drag-and-drop)** -- defer because: HIGH complexity, needs block editor library integration, and the simpler inline editing covers 80% of editing needs. Only worth it if Pavlo frequently restructures beat order.
- [ ] **Script Comparison View** -- defer because: needs version history, and comparing scripts is a rare action at 1 video/week.
- [ ] **Generation History / Undo** -- defer because: version tracking adds storage and UI complexity. At v1 cadence, regenerating is cheap.
- [ ] **Metrics Dashboard** -- defer because: metrics collection is paused, needs 10+ data points to be meaningful.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Script Generation Form | HIGH | LOW | P1 |
| Visual Dual-Track Display | HIGH | MEDIUM | P1 |
| Inline Script Editing | HIGH | LOW | P1 |
| Anti-Slop Score Display | HIGH | LOW | P1 |
| Script Persistence | HIGH | LOW | P1 |
| Script Library (list) | MEDIUM | LOW | P1 |
| Copy-to-Clipboard | MEDIUM | LOW | P1 |
| Hook Section Prominence | MEDIUM | LOW | P1 |
| Anti-Slop Inline Highlighting | HIGH | MEDIUM | P2 |
| Format Template Preview | MEDIUM | LOW | P2 |
| Script Search & Filter | MEDIUM | LOW | P2 |
| Quick Re-generate | MEDIUM | LOW | P2 |
| Keyboard Shortcuts | LOW | LOW | P2 |
| Score Breakdown Visualization | LOW | LOW | P2 |
| Beat-Block Editor (drag-drop) | MEDIUM | HIGH | P3 |
| Script Comparison View | LOW | MEDIUM | P3 |
| Generation History | LOW | MEDIUM | P3 |
| Metrics Dashboard | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- the web UI is pointless without these
- P2: Should have, add after core loop works
- P3: Nice to have, defer until workflow proves the need

## Competitor Feature Analysis

| Feature | Maekersuite | Squibler | VEED Script Gen | Kapwing | Our Approach |
|---------|-------------|----------|-----------------|---------|--------------|
| Script generation | AI from title + audience + tone | AI from draft/outline | AI from topic + length | AI script to video | AI from format template + dev context + brand voice |
| Editor type | Basic text editor | Chapter-based sidebar + editor | Simple textarea | Chat-based storyboard | Beat-block dual-track (visual + voiceover) |
| AI quality control | None visible | None visible | None visible | None visible | Anti-slop scoring (35+/50) with inline highlights |
| Script storage | Cloud, per account | Cloud, organized by project | Ephemeral (no save) | Per-project | Local DB, searchable library |
| Visual/audio tracks | Single track (text only) | Single track (prose) | Single track | Visual storyboard + voiceover | Explicit dual-track per beat |
| Customization | Tone selector, language | Genre templates | Video length, style | Iterate via chat | 7 devlog-specific formats, brand voice, pronunciation |
| Unique strength | SEO integration | Long-form story tools | Video generation | Script-to-video pipeline | Anti-slop + devlog-specific formats + dual-track |

**Key insight:** No existing tool combines anti-slop quality scoring with a visual/voiceover dual-track editor. Generic script tools output single-track text. Our dual-track display with per-beat visual directions is the structural differentiator. Anti-slop inline highlighting is the quality differentiator.

## Sources

- [Maekersuite Script Editor](https://maekersuite.com/tools/script-editor) -- AI script generation with step-by-step outline approach
- [Squibler AI Script Writer](https://www.squibler.io/ai-script-writer/) -- chapter-based sidebar editor with Smart Writer AI
- [BlockNote.js](https://www.blocknotejs.org/) -- block-based React rich text editor, Notion-style
- [Tiptap Notion-like Editor](https://tiptap.dev/docs/ui-components/templates/notion-like-editor) -- Notion-style block editor template
- [De-Slop Chrome Extension](https://github.com/HxHippy/DeSlop) -- pattern-matching slop detection with inline highlights and hover tooltips
- [Grammarly Writing Score](https://www.grammarly.com/readability) -- color-coded inline highlights (red/blue/green/purple) for writing quality
- [Originality.ai AI Detection](https://originality.ai/blog/highlight-ai-text) -- inline highlighting of AI-detected text
- [Kapwing Script to Video](https://www.kapwing.com/ai/script-to-video) -- script-to-storyboard with voiceover customization
- [Filter UI Patterns - UXPin](https://www.uxpin.com/studio/blog/filter-ui-and-ux/) -- filter UI/UX best practices
- [Notion-style Editors for React - Wisp](https://www.wisp.blog/blog/top-notion-style-wysiwyg-editors-for-react) -- comparison of block editor libraries

---
*Feature research for: Web UI for devlog scriptwriting pipeline*
*Researched: 2026-03-27*
