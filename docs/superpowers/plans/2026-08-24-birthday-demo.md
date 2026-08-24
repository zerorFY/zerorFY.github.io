# Birthday Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an age-8 generic birthday viewer at `/birthday-demo/` and uploader at `/birthday-demo-upload/`, with adaptive portrait frames and permanent `END PARTY` photo deletion.

**Architecture:** Copy the proven static birthday experience into independent new routes, fold the `/birthday1/` orientation classifier into the viewer, and keep the existing Supabase table, bucket, and Realtime transport. Put deletion orchestration in a small UMD module so it can be unit-tested without a browser and used by both the initial cleanup and uploader UI.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase JavaScript v2, Supabase Postgres/Storage/Realtime, GitHub Pages.

---

## File map

- `birthday-demo/index.html`: generic viewer markup and script order.
- `birthday-demo/style.css`: existing animation styling plus adaptive photo-frame rules.
- `birthday-demo/viewer.js`: animation, photo rotation, Realtime insert/delete refresh.
- `birthday-demo/photo-pool.js`: deterministic cloud/default photo pool builder.
- `birthday-demo/adaptive-layout.js`: image orientation classification.
- `birthday-demo/party-store.js`: upload, listing, subscription, and permanent deletion adapter.
- `birthday-demo/config.js`: routes and Supabase public configuration.
- `birthday-demo/assets/happy_birthday_fallback.wav`: local audio fallback.
- `birthday-demo-upload/index.html`: mobile upload and `END PARTY` UI.
- `birthday-demo-upload/upload.css`: responsive uploader and confirmation styling.
- `birthday-demo-upload/upload.js`: upload progress and deletion interaction.
- `birthday-demo/*.test.js`: unit and static contract tests.
- `birthday-demo/SUPABASE_SETUP.sql`: narrowly scoped delete policies.
- `birthday-demo/README_AGENT.md`: deployment and cleanup notes.

### Task 1: Establish the tested route contract

**Files:**
- Create: `birthday-demo/route-contract.test.js`
- Create: `birthday-demo/index.html`
- Create: `birthday-demo-upload/index.html`

- [ ] **Step 1: Write the failing route contract test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const viewer = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const uploader = fs.readFileSync(path.join(root, 'birthday-demo-upload/index.html'), 'utf8');

test('new routes are generic and linked to each other', () => {
  assert.match(viewer, /HAPPY 8TH BIRTHDAY/i);
  assert.match(uploader, /CHILDREN'S PARTY/i);
  assert.match(viewer, /href="\/birthday-demo-upload\/"/);
  assert.match(uploader, /href="\/birthday-demo\/"/);
  assert.doesNotMatch(viewer + uploader, /maxwell/i);
});

test('uploader includes a confirmed END PARTY action', () => {
  assert.match(uploader, /id="endPartyBtn"/);
  assert.match(uploader, /id="endPartyDialog"/);
  assert.match(uploader, /permanently deleted/i);
});
```

- [ ] **Step 2: Run `node --test birthday-demo/route-contract.test.js` and verify it fails because the new routes do not exist.**
- [ ] **Step 3: Copy the existing viewer and uploader markup, change only route references and generic age-8 wording, and add native confirmation-dialog markup.**
- [ ] **Step 4: Run the route test and verify both assertions pass.**

### Task 2: Add tested photo-pool and adaptive-frame behavior

**Files:**
- Create: `birthday-demo/photo-pool.js`
- Create: `birthday-demo/photo-pool.test.js`
- Create: `birthday-demo/adaptive-layout.js`
- Create: `birthday-demo/adaptive-layout.test.js`
- Create: `birthday-demo/style.css`

- [ ] **Step 1: Copy the existing photo-pool and adaptive-layout tests, adjusting imports to the new route.**
- [ ] **Step 2: Run `node --test birthday-demo/photo-pool.test.js birthday-demo/adaptive-layout.test.js` and verify missing-module failures.**
- [ ] **Step 3: Implement `buildPhotoPool(uploaded, defaults, slots)` and `getPhotoLayout(width, height)` with the existing tested behavior from `/birthday/` and `/birthday1/`.**
- [ ] **Step 4: Copy the animation stylesheet and append orientation-specific rules for `.photo-portrait`, `.photo-square`, `.photo-landscape`, and `.photo-wide`.**
- [ ] **Step 5: Run both tests and verify they pass.**

### Task 3: Add permanent photo deletion through a tested adapter

**Files:**
- Create: `birthday-demo/party-store.test.js`
- Create: `birthday-demo/party-store.js`
- Create: `birthday-demo/config.js`
- Create: `birthday-demo/SUPABASE_SETUP.sql`

- [ ] **Step 1: Write a failing adapter test with a fake Supabase client that returns two rows, records one bucket removal call, and records one table deletion call.**

```js
test('deleteAllPhotos removes storage objects before matching table rows', async () => {
  const calls = [];
  const client = createFakeClient(calls, [
    { id: 1, storage_path: 'uploads/a.jpg' },
    { id: 2, storage_path: 'uploads/b.jpg' }
  ]);
  const result = await deleteAllPhotos(client, { table: 'birthday_photos', bucket: 'maxwell-birthday' });
  assert.deepEqual(calls, [
    ['select', 'birthday_photos'],
    ['storage.remove', 'maxwell-birthday', ['uploads/a.jpg', 'uploads/b.jpg']],
    ['delete.in', 'birthday_photos', [1, 2]]
  ]);
  assert.deepEqual(result, { deleted: 2 });
});
```

- [ ] **Step 2: Add failing tests for an empty pool and for storage failure preventing row deletion.**
- [ ] **Step 3: Run `node --test birthday-demo/party-store.test.js` and verify the missing export failure.**
- [ ] **Step 4: Implement `deleteAllPhotos(client, cfg)` to select IDs/paths, return `{deleted: 0}` when empty, remove storage paths, then delete exactly the selected IDs. Throw any Supabase error.**
- [ ] **Step 5: Add SQL policies granting anonymous delete only on `birthday_photos` and storage objects where `bucket_id = 'maxwell-birthday'`.**
- [ ] **Step 6: Run the adapter tests and verify all pass.**

### Task 4: Wire viewer and uploader behavior

**Files:**
- Create: `birthday-demo/viewer-contract.test.js`
- Create: `birthday-demo/viewer.js`
- Create: `birthday-demo-upload/upload.js`
- Create: `birthday-demo-upload/upload.css`
- Create: `birthday-demo/assets/happy_birthday_fallback.wav`

- [ ] **Step 1: Write static contract tests asserting the viewer subscribes to both INSERT and DELETE, reloads cloud photos after deletion, and the uploader calls `deleteAllPhotos` only after dialog confirmation.**
- [ ] **Step 2: Run the contract tests and verify they fail because the scripts do not exist.**
- [ ] **Step 3: Copy the existing animation and upload behavior, rename globals to generic `Birthday*` names, load the adaptive classifier, and reload the cloud pool on Realtime delete.**
- [ ] **Step 4: Implement dialog open/cancel/confirm states; on confirm call `deleteAllPhotos`, clear previews, and display success or retryable failure text.**
- [ ] **Step 5: Copy the local audio fallback and add responsive dialog/END PARTY styles without weakening the large upload target.**
- [ ] **Step 6: Run all `birthday-demo/*.test.js` tests and verify they pass.**

### Task 5: Apply backend policies and clear the Maxwell photo pool

**Files:**
- Execute: `birthday-demo/SUPABASE_SETUP.sql`
- Use: `birthday-demo/party-store.js`

- [ ] **Step 1: Apply the two scoped delete policies in the existing Supabase project.**
- [ ] **Step 2: Run the deletion adapter against the configured project using only the browser-safe anon key.**
- [ ] **Step 3: Query `birthday_photos` and list the dedicated bucket to verify zero table rows and zero uploaded objects remain.**

### Task 6: Local acceptance verification

**Files:**
- Create: `birthday-demo/README_AGENT.md`
- Test: `birthday-demo/`
- Test: `birthday-demo-upload/`

- [ ] **Step 1: Run `node --test birthday-demo/*.test.js birthday1/*.test.js birthday/*.test.js` and verify zero failures.**
- [ ] **Step 2: Start a local static server at the repository root and verify HTTP 200 for both new routes.**
- [ ] **Step 3: Inspect at 1920×1080 and mobile widths 320, 375, 390, and 430; verify no horizontal overflow and correct portrait frames.**
- [ ] **Step 4: Scan both new route trees for `Maxwell` and verify zero matches.**
- [ ] **Step 5: Run `git diff --check` and a credential scan that confirms no service-role key exists.**

### Task 7: Commit, publish, and verify production

**Files:**
- Commit: all scoped files above.

- [ ] **Step 1: Review `git status` and confirm changes are limited to the design/plan and two new route trees.**
- [ ] **Step 2: Commit implementation with a scoped message and push `main` to its configured origin.**
- [ ] **Step 3: Wait for GitHub Pages deployment and verify HTTP 200 at both production URLs.**
- [ ] **Step 4: Open both live pages, verify generic age-8 wording, route links, portrait layout, backend readiness, and `END PARTY` availability.**
- [ ] **Step 5: Re-query the Supabase table/bucket and report the verified empty pre-party state.**

