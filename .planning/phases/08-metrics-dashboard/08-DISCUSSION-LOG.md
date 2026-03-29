# Phase 8: Metrics & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-29
**Phase:** 08-metrics-dashboard
**Areas discussed:** Dashboard layout, Sync UX, Retention chart style, Script-video linking UX

---

## Dashboard Layout

### Page Location
| Option | Description | Selected |
|--------|-------------|----------|
| New /dashboard page | Separate page in nav | |
| Extend /scripts page | Metrics alongside scripts, no new page | ✓ |
| Tab on /scripts page | Two tabs: Scripts and Videos | |

### Metrics Display
| Option | Description | Selected |
|--------|-------------|----------|
| Inline mini-stats | Small numbers next to script row | |
| Expandable card below | Click to expand metrics card under script row | ✓ |
| Side panel | Slide-in panel from right | |

**User's additional input:** Replace copy action button with chevron (▼) to expand/collapse. Arrow without tail (pure caret).

---

## Sync UX

### Button Placement
| Option | Description | Selected |
|--------|-------------|----------|
| On settings page | Next to YouTube connection card | |
| On scripts page | Where you see the data | ✓ |
| Both places | Redundant but convenient | |

### Progress Display
| Option | Description | Selected |
|--------|-------------|----------|
| Simple spinner | Spinner on button, 'Syncing...' | |
| Progress with count | 'Syncing 3/6 videos...' | ✓ |
| You decide | Claude picks simplest | |

---

## Retention Chart Style

| Option | Description | Selected |
|--------|-------------|----------|
| Small sparkline | ~100px, click to expand full-size | ✓ |
| Full chart in card | Full-width always visible when expanded | |
| You decide | Claude picks | |

---

## Script-Video Linking UX

| Option | Description | Selected |
|--------|-------------|----------|
| In expanded metrics card | 'Link video' dropdown in expanded card | |
| On script editor page | Dropdown on /script/[id] editor | ✓ |
| Both places | Link from list or editor | |

---

## Claude's Discretion

- Sync implementation internals
- API call ordering
- Expanded card layout/spacing
- Error handling patterns

## Deferred Ideas

None
