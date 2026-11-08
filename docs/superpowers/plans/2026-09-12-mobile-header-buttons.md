# Mobile header buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the thumb toggle and API switch buttons in the mobile (≤700px) header row.

**Architecture:** CSS-only change inside the existing `@media (max-width: 700px)` block in `src/style.css`. No HTML/JS touched; both buttons reuse desktop markup and handlers.

**Tech Stack:** Plain CSS, Vite build, Node tests (regression only).

---

### Task 1: Re-show thumb + API buttons on mobile header

**Files:**
- Modify: `src/style.css` (the `@media (max-width: 700px)` header block, currently lines ~1152-1163)
- Verify: `dist/assets/*.css` (built output), `npm test`, `npm run build`

- [ ] **Step 1: Read the current mobile header block**

Read `src/style.css` around the `@media (max-width: 700px)` header block. It currently contains:

```css
@media (max-width: 700px) {
  .header { flex-wrap: wrap; gap: 8px; padding: 10px 12px; min-height: auto; }
  .header h1 { width: 100%; font-size: 20px; }
  .top-nav { display: none; }
  .header-search { order: 3; width: 100%; }
  .api-toggle-btn, .settings-btn { display: none; }
  #screen-home { padding: 0 12px 72px; }
  .home-hero-copy { left: 14px; right: 14px; }
  .home-hero-side-grid { display: none; }
  .poster-card { flex-basis: 40vw; }
  .home-rows { padding: 16px 0 64px; }
}
```

- [ ] **Step 2: Apply the CSS edit**

Replace the `h1` line and the `display:none` line so the block becomes:

```css
@media (max-width: 700px) {
  .header { flex-wrap: wrap; gap: 8px; padding: 10px 12px; min-height: auto; }
  .header h1 { flex: 1; min-width: 0; font-size: 20px; }
  .top-nav { display: none; }
  .header-search { order: 3; width: 100%; }
  .api-toggle-btn { min-height: 40px; padding: 0 10px; font-size: 12px; }
  .settings-btn { min-height: 40px; width: 40px; height: 40px; font-size: 20px; }
  #screen-home { padding: 0 12px 72px; }
  .home-hero-copy { left: 14px; right: 14px; }
  .home-hero-side-grid { display: none; }
  .poster-card { flex-basis: 40vw; }
  .home-rows { padding: 16px 0 64px; }
}
```

Notes: `flex: 1` overrides the desktop `flex: 0 0 auto` on `.header h1`, so the title shares row 1 with the two fixed-size buttons; `.header-search` keeps `order: 3; width: 100%` on row 2. Desktop rules outside this media query are untouched.

- [ ] **Step 3: Run regression tests and build**

Run:

```bash
npm test
```

Expected: all tests pass (29/29, 0 fail) — this change touches no JS, so tests are regression-only.

Run:

```bash
npm run build
```

Expected: `✓ built in ...` with no errors.

- [ ] **Step 4: Verify the built CSS contains the fix**

Run (PowerShell):

```powershell
Select-String -Path dist/assets/*.css -Pattern "settings-btn\{min-height:40px"
```

Expected: one match. Also confirm no `display:none` rule still targets `.api-toggle-btn` / `.settings-btn` inside the max-width:700px block.

- [ ] **Step 5: Visual check (manual, narrow viewport)**

Resize a browser below 700px wide (or use a real phone / devtools device mode) and confirm: row 1 shows [title] [API button] [🖼 button]; row 2 shows the full-width search; tapping the API button cycles sources and tapping 🖼 hides/shows posters.

- [ ] **Step 6: Commit and push**

```bash
git add src/style.css
git commit -m "feat: show thumb + API toggle buttons in mobile header"
git push
```

Expected: push succeeds; Vercel redeploys web, GitHub Actions builds the next APK release.
