# Phase 5: Script Editor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 05-script-editor
**Areas discussed:** Edit interaction, Beat regeneration, Hook variant switching, Score updates

---

## Edit Interaction

### Q1: How should beat editing work when Pavlo clicks on text?

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-edit | Text looks normal, click switches to textarea. Save on blur or Enter. Notion-style. | ✓ |
| Always-editable | Both visual and voiceover are always textareas. Simpler but noisier. | |
| You decide | Claude picks based on design and existing patterns. | |

**User's choice:** Click-to-edit (Recommended)
**Notes:** None

### Q2: How should auto-save work after editing a beat?

| Option | Description | Selected |
|--------|-------------|----------|
| Save on blur | Changes save when clicking away from textarea. No save button. Notion-style. | ✓ |
| Debounced save | Changes save 1-2 seconds after typing stops. More immediate but more DB writes. | |
| You decide | Claude picks based on UX patterns. | |

**User's choice:** Save on blur (Recommended)
**Notes:** None

### Q3: Should the editor be a separate page or replace ScriptDisplay?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate page (/script/[id]) | Dedicated editor layout, clean URL. Phase 6 library links directly. | ✓ |
| Same page | ScriptDisplay becomes editable in-place. Simpler routing. | |
| You decide | Claude picks based on routing patterns. | |

**User's choice:** Separate page (Recommended)
**Notes:** None

---

## Beat Regeneration

### Q1: Where should the regenerate button live on each beat card?

| Option | Description | Selected |
|--------|-------------|----------|
| Icon button in corner | Small refresh/sparkle icon in top-right corner. Always visible. | ✓ |
| Show on hover | Button only appears on hover. Cleaner but less discoverable. | |
| You decide | Claude picks based on existing card patterns. | |

**User's choice:** Icon button in corner (Recommended)
**Notes:** None

### Q2: Should AI see surrounding beats when regenerating a single beat?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full script context | Send all beats + dev context. Better coherence, more tokens. | ✓ |
| Just the beat + format | Only the beat being regenerated. Faster but may not match flow. | |
| You decide | Claude picks based on cost considerations. | |

**User's choice:** Yes, full script context (Recommended)
**Notes:** None

---

## Hook Variant Switching

### Q1: How should hook variant selection work?

| Option | Description | Selected |
|--------|-------------|----------|
| Tab bar (A / B / C) | Tabs above first beat. Selected tab shows that hook content. | ✓ |
| Radio buttons | Radio group showing variant labels with preview. | |
| You decide | Claude picks based on UI patterns. | |

**User's choice:** Tab bar (Recommended)
**Notes:** None

### Q2: When switching hook variant, should beat #1 update to match?

| Option | Description | Selected |
|--------|-------------|----------|
| Hooks stay separate | Hook section above beats list. Switching previews hook, doesn't modify beat #1. | ✓ |
| Hook replaces beat #1 | Switching variant overwrites beat #1 content. Simpler but destructive. | |
| You decide | Claude picks based on data model. | |

**User's choice:** Hooks stay separate
**Notes:** User specified "hooks stay separate but also editable" — hook variant content should be click-to-edit, same interaction as beat editing.

---

## Score Updates

### Q1: When should anti-slop score recalculate after edits?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual rescore button | "Rescore" button next to score panel. Shows "stale" indicator after edits. | ✓ |
| Auto-rescore on blur | Triggers AI rescoring every time a beat is saved. Always up-to-date but slow. | |
| You decide | Claude picks based on UX and API cost. | |

**User's choice:** Manual rescore button (Recommended)
**Notes:** None

### Q2: Should the score panel be sticky or scroll with the page?

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky sidebar | Score stays visible on right side while scrolling beats. | |
| Scroll with page | Score sits below beats, scrolls normally. | ✓ |
| You decide | Claude picks based on layout. | |

**User's choice:** Scroll with page
**Notes:** User chose simpler layout over always-visible score.

---

## Claude's Discretion

- Loading state during single-beat regeneration
- Error handling for failed regeneration/rescoring
- Visual feedback for click-to-edit transitions
- Textarea auto-height behavior
- Server action design
- Layout proportions and spacing

## Deferred Ideas

None — discussion stayed within phase scope
