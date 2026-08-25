# Birthday Demo Internal Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a shared-key-protected `/birthday-demo-stats/` page backed by the existing birthday usage sessions.

**Architecture:** Add one idempotent Supabase migration containing a private key-digest table and a narrow JSON statistics RPC. Build a standalone static page that polls the RPC every five seconds and uses a pure model module for normalization and formatting.

**Tech Stack:** PostgreSQL/Supabase RPC, vanilla HTML/CSS/JavaScript, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Lock the route and SQL contracts

**Files:**
- Create: `birthday-demo-stats/stats-contract.test.js`
- Create: `birthday-demo/ADD_STATS.sql`

- [ ] **Step 1: Write failing contract tests**

Assert that the new route contains an access-key form, six required metric labels, Current Sessions and Recent Sessions; neither existing public page contains `birthday-demo-stats`; and SQL contains `America/Toronto`, a private digest table with RLS, `birthday_usage_stats(text, integer)`, stale closure, a 1–50 recent limit, generic `STATS_ACCESS_DENIED`, revoked table access, and anon execute only on the RPC.

- [ ] **Step 2: Run the contract test and verify RED**

Run: `node --test birthday-demo-stats/stats-contract.test.js`
Expected: FAIL because the route and migration do not exist.

- [ ] **Step 3: Add the idempotent migration**

Create `birthday_stats_access` with one SHA-256 digest row configured separately during deployment. Implement `birthday_usage_stats(p_access_key text, p_recent_limit integer default 12)` as `security definer`; reject incorrect keys, call `birthday_usage_close_stale()`, use Toronto-local day boundaries, and return `generated_at`, `summary`, `live_sessions`, and `recent_sessions` as JSONB. Revoke all defaults and grant execute only to `anon`.

- [ ] **Step 4: Run the contract test and verify the SQL portion is GREEN**

Run: `node --test birthday-demo-stats/stats-contract.test.js`
Expected: route assertions still fail while SQL assertions pass.

### Task 2: Build the pure stats model

**Files:**
- Create: `birthday-demo-stats/stats-model.test.js`
- Create: `birthday-demo-stats/stats-model.js`

- [ ] **Step 1: Write failing model tests**

Test `formatDuration(0) === '0s'`, compact hour/minute/second formatting, Toronto date formatting, normalization of missing summary/session arrays, title-casing fixed scene names, and Live/Finished status normalization.

- [ ] **Step 2: Run model tests and verify RED**

Run: `node --test birthday-demo-stats/stats-model.test.js`
Expected: FAIL because `stats-model.js` does not exist.

- [ ] **Step 3: Implement the minimal UMD model**

Export `formatDuration`, `formatTorontoDateTime`, `formatScene`, and `normalizeStats`. Keep the module DOM-free and accept only the fixed six scene values.

- [ ] **Step 4: Run model tests and verify GREEN**

Run: `node --test birthday-demo-stats/stats-model.test.js`
Expected: all model tests pass.

### Task 3: Build the locked polling page

**Files:**
- Create: `birthday-demo-stats/index.html`
- Create: `birthday-demo-stats/style.css`
- Create: `birthday-demo-stats/stats.js`
- Modify: `birthday-demo-stats/stats-contract.test.js`

- [ ] **Step 1: Complete failing page contract assertions**

Require the Supabase browser library, existing `/birthday-demo/config.js`, local model and controller scripts, a password input, no public-route links, a five-second poll constant, `sessionStorage`, one-in-flight guard, and all requested fields.

- [ ] **Step 2: Run and verify RED**

Run: `node --test birthday-demo-stats/stats-contract.test.js`
Expected: FAIL on missing page/controller content.

- [ ] **Step 3: Implement the page shell and styling**

Create a responsive English-only lock screen and hidden dashboard with six metric cards, live-session cards, recent-session table, Toronto time-zone label, refresh status, and restrained monochrome styling.

- [ ] **Step 4: Implement polling and rendering**

Read/write only `birthday-demo-stats-key` in `sessionStorage`; call `birthday_usage_stats` with `{p_access_key, p_recent_limit: 12}` immediately after unlock and every 5000 ms; prevent overlapping requests; clear the key on `STATS_ACCESS_DENIED`; preserve last good data on transient errors; render all required fields through textContent.

- [ ] **Step 5: Run route and model tests and verify GREEN**

Run: `node --test birthday-demo-stats/*.test.js`
Expected: all stats tests pass.

### Task 4: Regression verification and documentation

**Files:**
- Modify: `birthday-demo/README_AGENT.md`

- [ ] **Step 1: Document the stats migration, out-of-repo key configuration, URL, Toronto reporting boundary, polling interval, and 90-second stale rule.**

- [ ] **Step 2: Run the complete suite and syntax checks**

Run: `node --test --test-isolation=none birthday-demo-stats/*.test.js birthday-demo/*.test.js birthday1/*.test.js birthday/*.test.js`

Run: `node --check birthday-demo-stats/stats-model.js && node --check birthday-demo-stats/stats.js`

Expected: zero failures and zero syntax errors.

- [ ] **Step 3: Commit the implementation**

Commit the migration, page, tests, and documentation as one focused feature commit.

### Task 5: Migrate, publish, and prove production behavior

**Files:**
- No additional source files unless production verification reveals a tested defect.

- [ ] **Step 1: Run `ADD_STATS.sql` in the existing Supabase project.**

- [ ] **Step 2: Configure the private key digest directly in Supabase**

Execute a one-off statement that stores the SHA-256 digest of the user-provided key without committing the plaintext value.

- [ ] **Step 3: Verify access control through production RPC**

Confirm an incorrect key fails with `STATS_ACCESS_DENIED`; confirm the configured key returns the four JSON sections.

- [ ] **Step 4: Rebase if necessary, push `main`, and wait for GitHub Pages to report the exact commit as built.**

- [ ] **Step 5: Perform the real acceptance sequence**

Unlock `/birthday-demo-stats/`; record Today Opens; open `/birthday-demo/` and verify +1 immediately; wait beyond 30 seconds and verify duration/scene heartbeat changes; close the viewer; poll beyond 90 seconds and verify Finished with frozen duration; reopen the viewer and verify a distinct session and another +1.

- [ ] **Step 6: Final audit**

Re-run the full suite, inspect both public pages for absence of stats links, verify Git status is clean and `HEAD == origin/main`, and report the production URL and evidence.
