# Mobile header buttons — design spec

Date: 2026-09-12 | Status: approved by user | Scope: CSS only, no HTML/JS changes

## Problem
On mobile viewports (≤700px) the header hides two desktop features via
`display:none` (`src/style.css`, mobile media query):
- `#thumb-btn` (🖼 toggle poster images on/off)
- `#api-toggle-btn` (switch API source: Proxy / OPhim / PhimAPI)

Mobile users currently have no way to toggle images or switch API source.

## Decision
Option A (chosen): re-show both buttons in the mobile header row, compacted.
Rejected: B (move to bottom-bar — already has 4 buttons, would get cramped,
needs HTML+JS edits), C (new "⋯ More" popup menu — most code for 2 buttons).

## Change
File: `src/style.css`, inside `@media (max-width: 700px)` block only.
1. Remove `.api-toggle-btn, .settings-btn` from the `display:none` rule.
2. `.header h1`: `width:100%` → `flex:1` (keep `font-size:20px`) so the title
   shares row 1 with the two buttons instead of pushing everything down.
3. Compact the buttons for narrow screens: `min-height:40px`, reduced padding
   (`0 10px` for API toggle), smaller font (`12px` API label, `20px` thumb icon).
4. `.header-search` stays `order:3; width:100%` on its own row below, unchanged.
5. No HTML/JS changes: both buttons reuse existing desktop markup and handlers.

## Layout result (≤700px)
Row 1: [WebPhim title (flex:1)] [API btn] [🖼 btn]
Row 2: [search input full width]
Rest of page unchanged. At 320px wide the row still fits: title shrinks
(flex:1, min-width:0), buttons are fixed ~40px each.

## Testing
1. Resize browser <700px (and a real phone): both buttons visible in header row 1.
2. Tap API button: label/dot cycles sources, list reloads from new source.
3. Tap 🖼 button: posters hide/show, state persists as on desktop.
4. `npm test` passes, `npm run build` succeeds.

## Risks
- Crowding on very narrow screens: mitigated by compact sizing + flex:1 title.
- None functional: zero JS/HTML touched, desktop (>700px) rules untouched.
