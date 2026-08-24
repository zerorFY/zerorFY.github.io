# Birthday Usage Counter and Shared Photo Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private background usage counter and a database-enforced 20-photo shared-pool limit to the live English birthday demo.

**Architecture:** Keep capacity planning and session timing in small UMD modules with Node-testable factories. Extend the existing Supabase adapter for count, rollback, and RPC calls; an idempotent SQL migration enforces the hard insert cap and exposes only narrow usage functions.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase JavaScript v2, PostgreSQL functions/triggers/RLS, GitHub Pages.

---

### Task 1: Define deterministic batch capacity

**Files:**
- Create: `birthday-demo/photo-capacity.test.js`
- Create: `birthday-demo/photo-capacity.js`

- [ ] **Step 1: Write failing tests for empty, nearly full, and full pools.**

```js
const { planPhotoBatch } = require('./photo-capacity.js');

test('accepts only 20 of 25 files in an empty shared pool', () => {
  const files = Array.from({ length: 25 }, (_, index) => `photo-${index}`);
  const plan = planPhotoBatch(0, files, 20);
  assert.equal(plan.accepted.length, 20);
  assert.equal(plan.rejected.length, 5);
  assert.equal(plan.limitReached, true);
});

test('accepts one file when 19 already exist', () => {
  assert.deepEqual(planPhotoBatch(19, ['a', 'b'], 20), {
    accepted: ['a'], rejected: ['b'], remaining: 0, limitReached: true
  });
});

test('rejects every file when the shared pool already has 20', () => {
  assert.equal(planPhotoBatch(20, ['a'], 20).accepted.length, 0);
});
```

- [ ] **Step 2: Run `node --test --test-isolation=none birthday-demo/photo-capacity.test.js`; verify the module-not-found failure.**
- [ ] **Step 3: Implement `planPhotoBatch(currentCount, files, maximum)` by clamping remaining capacity and slicing accepted/rejected arrays.**
- [ ] **Step 4: Re-run the test and verify all capacity cases pass.**

### Task 2: Add count, insert rollback, and limit error mapping

**Files:**
- Modify: `birthday-demo/party-store.test.js`
- Modify: `birthday-demo/party-store.js`
- Modify: `birthday-demo/config.js`

- [ ] **Step 1: Add failing tests that require `getPhotoCount()` to issue an exact count query and require `uploadPhoto()` to remove its Storage object when row insertion returns `BIRTHDAY_PHOTO_LIMIT_REACHED`.**
- [ ] **Step 2: Run `node --test --test-isolation=none birthday-demo/party-store.test.js`; verify the missing behavior failures.**
- [ ] **Step 3: Implement `getPhotoCount()` with Supabase `{ count: 'exact', head: true }`, set `maxPhotos: 20`, and wrap row insertion so any insert failure removes the just-uploaded path before throwing. Map the database limit message to an error with `code = 'PHOTO_LIMIT_REACHED'`.**
- [ ] **Step 4: Re-run the adapter tests and verify count, rollback, and existing deletion tests pass.**

### Task 3: Add the background usage-session module

**Files:**
- Create: `birthday-demo/usage-counter.test.js`
- Create: `birthday-demo/usage-counter.js`
- Modify: `birthday-demo/party-store.js`
- Modify: `birthday-demo/viewer.js`
- Modify: `birthday-demo/index.html`

- [ ] **Step 1: Write failing tests for one start, a 30-second heartbeat, scene updates, hidden-time exclusion, and page-hide final heartbeat using injected clock/transport functions.**

```js
const counter = createUsageCounter({ transport, now, randomUUID, documentRef, windowRef, setIntervalFn });
await counter.start();
counter.setScene('spider');
clock += 30000;
await counter.heartbeat();
assert.deepEqual(transport.heartbeats[0], {
  sessionId: 'session-1', durationSeconds: 30, scene: 'spider'
});
```

- [ ] **Step 2: Run `node --test --test-isolation=none birthday-demo/usage-counter.test.js`; verify the missing-module failure.**
- [ ] **Step 3: Implement the factory with a fixed scene allowlist, 30-second scheduling, accumulated visible milliseconds, `visibilitychange`, and `pagehide`. Export it for Node and auto-start once only when loaded by the viewer.**
- [ ] **Step 4: Add `startUsageSession(sessionId, scene)` and `heartbeatUsageSession(sessionId, durationSeconds, scene)` RPC wrappers to the store.**
- [ ] **Step 5: Load `usage-counter.js` only in viewer HTML and call `BirthdayUsageCounter.setScene(id)` on every animation scene change.**
- [ ] **Step 6: Re-run usage and viewer-contract tests; verify the uploader HTML has no usage-counter script.**

### Task 4: Add the hidden English limit notice and capacity-aware uploads

**Files:**
- Modify: `birthday-demo/route-contract.test.js`
- Modify: `birthday-demo-upload/index.html`
- Modify: `birthday-demo-upload/upload.js`
- Modify: `birthday-demo-upload/end-party.css`

- [ ] **Step 1: Add failing static tests for `id="photoLimitNotice" hidden`, the exact English message, `planPhotoBatch`, and zero Chinese characters in user-facing HTML/scripts.**
- [ ] **Step 2: Run route/viewer contract tests and verify the new assertions fail.**
- [ ] **Step 3: Load `/birthday-demo/photo-capacity.js`, add the hidden notice, query `api.getPhotoCount()` after selection, and upload only `plan.accepted`. Reveal the notice only when `plan.limitReached` or a concurrent `PHOTO_LIMIT_REACHED` error occurs.**
- [ ] **Step 4: Preserve individual retry state for ordinary errors and stop processing further files after a concurrent limit error.**
- [ ] **Step 5: Add notice styling that does not reserve visible space while `[hidden]` is present.**
- [ ] **Step 6: Re-run all new route, capacity, and adapter tests.**

### Task 5: Create the idempotent Supabase migration

**Files:**
- Create: `birthday-demo/ADD_USAGE_AND_LIMIT.sql`
- Modify: `birthday-demo/route-contract.test.js`
- Modify: `birthday-demo/README_AGENT.md`

- [ ] **Step 1: Add a failing SQL contract test requiring `birthday_usage_sessions`, RLS without anon table policies, `birthday_usage_start`, `birthday_usage_heartbeat`, a 90-second stale-session close, an advisory-lock photo-limit trigger, and the literal limit of 20.**
- [ ] **Step 2: Run the SQL contract test and verify the migration-file-not-found failure.**
- [ ] **Step 3: Implement the idempotent schema/functions/trigger. Revoke public function access, then grant execute only on the two usage RPCs to `anon`; validate scenes against the six-name allowlist.**
- [ ] **Step 4: Include idempotent table/storage delete policies required by rollback and `END PARTY`, and update deployment notes to run this migration instead of the earlier delete-only migration.**
- [ ] **Step 5: Re-run SQL contract tests and scan the migration for accidental public SELECT access to usage rows.**

### Task 6: Verify, migrate, clear, publish, and retest

**Files:**
- Test: `birthday-demo/`
- Test: `birthday-demo-upload/`
- Execute: `birthday-demo/ADD_USAGE_AND_LIMIT.sql`

- [ ] **Step 1: Run `node --test --test-isolation=none birthday-demo/*.test.js birthday1/*.test.js birthday/*.test.js`, three `node --check` commands, `git diff --check`, English-only/Maxwell scans, and local HTTP checks.**
- [ ] **Step 2: At 1920×1080 and mobile widths 320, 375, 390, and 430, verify no overflow; confirm the limit notice is initially hidden.**
- [ ] **Step 3: In Supabase SQL Editor, run `ADD_USAGE_AND_LIMIT.sql` and verify success.**
- [ ] **Step 4: After the required action-time confirmation, delete all existing photo rows and every upload object; verify both counts are zero.**
- [ ] **Step 5: Test 20 successful uploads, a visible English rejection for the 21st, and `END PARTY` returning both table and bucket to zero.**
- [ ] **Step 6: Commit, rebase onto current `origin/main`, push, wait for GitHub Pages, and verify both production routes plus one usage session/heartbeat row.**

