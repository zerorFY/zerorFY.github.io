# Birthday Photo Pool Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep five photo positions filled while uploaded photos take priority and defaults disappear once five uploads exist.

**Architecture:** Add a small pure photo-pool module that can be tested with Node's built-in test runner and used directly by the browser. `viewer.js` will keep uploaded photos separate from the effective five-slot pool, rebuild it after the initial query and every realtime insert, and preserve all existing animation and timing constants.

**Tech Stack:** Vanilla JavaScript, Node.js `node:test`, Supabase JavaScript client, GitHub Pages.

---

### Task 1: Test and implement photo-pool selection

**Files:**
- Create: `birthday/photo-pool.test.js`
- Create: `birthday/photo-pool.js`

- [ ] **Step 1: Write the failing test**

Create `birthday/photo-pool.test.js` with cases for zero, one, four, five, and six uploads. Assert that every result has at least five entries, that four uploads use exactly one default, and that five or more uploads contain no defaults.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test birthday/photo-pool.test.js`

Expected: FAIL because `./photo-pool.js` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `birthday/photo-pool.js` as a browser/CommonJS module exporting:

```js
function buildPhotoPool(uploaded, defaults, slots = 5) {
  const uniqueUploads = [...new Set((uploaded || []).filter(Boolean))];
  if (uniqueUploads.length >= slots) return uniqueUploads;
  const fallback = (defaults || []).filter(Boolean);
  const needed = slots - uniqueUploads.length;
  const fillers = Array.from({ length: needed }, (_, index) => fallback[index % fallback.length]);
  return [...uniqueUploads, ...fillers];
}
```

Expose it as `window.MaxwellPhotoPool` in browsers and `module.exports` in Node.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test birthday/photo-pool.test.js`

Expected: all five cases PASS with no warnings.

- [ ] **Step 5: Commit**

Run:

```text
git add birthday/photo-pool.js birthday/photo-pool.test.js
git commit -m "test: define birthday photo pool priority"
```

### Task 2: Integrate the pool into the live viewer

**Files:**
- Modify: `birthday/index.html`
- Modify: `birthday/viewer.js`

- [ ] **Step 1: Add the browser module before the viewer script**

Load `photo-pool.js` immediately before `viewer.js` in `birthday/index.html`.

- [ ] **Step 2: Keep uploaded photos separate and rebuild the effective pool**

In `birthday/viewer.js`, add `let cloudPhotos = []` and a `rebuildPool()` helper that calls `window.MaxwellPhotoPool.buildPhotoPool(cloudPhotos, defaults, 5)`. Reduce built-in cards to five themed cards: two Labubu, two Spider-Man, and one football card.

- [ ] **Step 3: Apply the rule on initial hydration and realtime inserts**

Set `cloudPhotos` from `listPhotos(200)`, call `rebuildPool()`, then `renderCards()`. On every realtime insert, prepend the unique URL to `cloudPhotos`, rebuild the pool, and render all five positions so the number of default cards updates immediately without a refresh.

- [ ] **Step 4: Run syntax and regression tests**

Run:

```text
node --check birthday/viewer.js
node --check birthday/photo-pool.js
node --test birthday/photo-pool.test.js
```

Expected: syntax checks exit 0 and all tests PASS.

- [ ] **Step 5: Commit**

Run:

```text
git add birthday/index.html birthday/viewer.js
git commit -m "feat: prioritize uploaded birthday photos"
```

### Task 3: Remove acceptance-test data

**Files:**
- No repository files.

- [ ] **Step 1: Delete the twelve `realtime-*.svg` Storage objects**

Use the Supabase dashboard Storage UI in `maxwell-birthday/uploads` and delete only the twelve SVG files created by acceptance tests.

- [ ] **Step 2: Delete matching table rows**

Run in Supabase SQL Editor:

```sql
delete from public.birthday_photos
where storage_path like 'uploads/%-realtime-%.svg'
returning id, storage_path;
```

Expected: 12 rows returned.

- [ ] **Step 3: Verify cleanup**

Use public REST and Storage listing endpoints and confirm zero matching table rows and zero matching objects.

### Task 4: Deploy and verify production

**Files:**
- No additional repository files.

- [ ] **Step 1: Push commits**

Run: `git push origin main`

Expected: GitHub accepts the commits and `origin/main` matches local `HEAD`.

- [ ] **Step 2: Verify production assets**

Confirm `https://zeror.ca/birthday/photo-pool.js` returns 200 and the production HTML loads it before `viewer.js`.

- [ ] **Step 3: Verify responsive and media behavior**

Check `/birthday/upload/` at 320, 360, 390, 414, and 430 pixels with no horizontal overflow. Play music and confirm the audio clock advances.

- [ ] **Step 4: Verify photo behavior and realtime**

With no user photos, confirm five themed default cards and no TEST cards. Upload photos from the real phone, confirm four uploads plus one default, and measure the desktop realtime update without refreshing.

- [ ] **Step 5: Verify the full animation loop**

Monitor at least 184 seconds and confirm opening, Labubu, Spider-Man, football, mixed, finale, and return to opening at approximately 180 seconds.

- [ ] **Step 6: Final verification and completion**

Run credential scans, syntax tests, REST connectivity checks, remote-commit checks, and `git status --short`. Report URLs, Supabase connection, upload success, measured realtime latency, no-refresh result, and unresolved issues.
