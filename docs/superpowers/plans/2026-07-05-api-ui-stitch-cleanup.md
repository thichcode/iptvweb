# API UI Stitch Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore movie data/images, remove obvious UI design violations, and add a Stitch-ready design system file.

**Architecture:** Keep the app vanilla Vite and avoid new dependencies. Fix the API at the shared `src/api.js` boundary so every screen benefits, then apply a narrow CSS/markup cleanup and add `DESIGN.md` as documentation.

**Tech Stack:** Vite, vanilla JavaScript modules, Node test runner, CSS.

---

### Task 1: Restore API and Image Loading

**Files:**
- Modify: `src/api.js`
- Modify: `test/mobile-limit.test.js`

- [ ] Add tests that default API base is `https://ophim1.com`, relative images resolve to `https://img.ophim.live/uploads/movies/<file>`, and absolute image URLs pass through unchanged.
- [ ] Run `npm test` and confirm the new tests fail before implementation.
- [ ] Export `API_BASE`, use `https://ophim1.com` as the default base, export `IMAGE_BASE`, and simplify `imgSrc()` to avoid the dead `phimapi.com/image.php` proxy.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Small UI Cleanup

**Files:**
- Modify: `src/screens/home.js`
- Modify: `src/style.css`
- Modify: `test/ui-regressions.test.js`

- [ ] Add tests that home markup contains no emoji icon spans and CSS does not use `#000` / `#000000`.
- [ ] Run `npm test` and confirm the new tests fail before implementation.
- [ ] Remove wheel emoji icons and replace pure black CSS values with off-black theme values.
- [ ] Run `npm test` and confirm all tests pass.

### Task 3: Stitch Design System

**Files:**
- Create: `DESIGN.md`

- [ ] Write a Stitch-oriented `DESIGN.md` for WebPhim with cinema atmosphere, one amber accent, typography rules, component rules, responsive rules, API/image constraints, and banned patterns.
- [ ] Run `npm test` and `npm run build` after documentation is added.

### Final Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Check `git diff` contains only the intended API, UI, tests, and design-system changes.
