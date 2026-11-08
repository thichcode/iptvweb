# Mobile Four Movies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit mobile movie list pages to 4 rendered movie cards to reduce image load failures.

**Architecture:** Keep existing API/list structure. Add a small exported limit helper in `src/api.js`, pass `limit` through URL builders, and slice rendered list items on mobile in `src/screens/list.js` as a fallback for endpoints that ignore `limit`.

**Tech Stack:** Vite, vanilla JavaScript modules, Node built-in `node:test`.

---

### Task 1: Mobile Limit Helpers And Rendering

**Files:**
- Modify: `package.json`
- Modify: `src/api.js`
- Modify: `src/screens/list.js`
- Create: `test/mobile-limit.test.js`

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getMovieLimit, buildMovieUrl } from '../src/api.js'
import { limitRenderedItems } from '../src/screens/list.js'

test('mobile viewport uses 4 movies per page', () => {
  assert.equal(getMovieLimit(true), 4)
  assert.equal(getMovieLimit(false), 20)
})

test('API URLs include the requested limit for endpoints that support it', () => {
  assert.equal(buildMovieUrl('phim-bo', 2, '', '', '', 4), '/v1/api/danh-sach/phim-bo?page=2&limit=4')
  assert.equal(buildMovieUrl('search', 1, 'test phim', '', '', 4), '/v1/api/tim-kiem?keyword=test%20phim&page=1&limit=4')
})

test('mobile render fallback only keeps first 4 items', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ slug: String(i) }))
  assert.equal(limitRenderedItems(items, true).length, 4)
  assert.equal(limitRenderedItems(items, false).length, 10)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `test` script and exported helpers do not exist.

- [ ] **Step 3: Implement minimal code**

Add `test` script, `getMovieLimit`, `buildMovieUrl`, and `limitRenderedItems`; use them in existing calls.

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: Vite build succeeds.

- [ ] **Step 5: Commit and push**

Run: `git add package.json src/api.js src/screens/list.js test/mobile-limit.test.js docs/superpowers/plans/2026-07-02-mobile-four-movies.md && git commit -m "fix: limit mobile movie list to four cards" && git push origin main`
