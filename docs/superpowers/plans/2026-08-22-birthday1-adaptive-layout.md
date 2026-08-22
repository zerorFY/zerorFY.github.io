# Birthday1 Adaptive Photo Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `/birthday1/` as an isolated adaptive-aspect-ratio viewer that reuses the production birthday page, scripts, Supabase data, animation, music, and upload page.

**Architecture:** A small bootstrap loader fetches `/birthday/index.html`, reuses its body markup, rewrites two relative asset links, and loads the original production scripts. A birthday1-only observer classifies every photo after decoding and applies scoped CSS that preserves natural aspect ratios without changing `/birthday/`.

**Tech Stack:** Vanilla JavaScript, Node.js `node:test`, CSS, Supabase Realtime, GitHub Pages.

---

### Task 1: Test and implement aspect-ratio classification

**Files:**
- Create: `birthday1/adaptive-layout.test.js`
- Create: `birthday1/adaptive-layout.js`

- [ ] **Step 1: Write the failing classification tests**

Create tests for portrait (`9:16`), square (`1:1`), landscape (`4:3`), wide (`2:1`), invalid dimensions, and safe-ratio clamping to `0.58–1.78`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --test-isolation=none birthday1/adaptive-layout.test.js`

Expected: FAIL because `adaptive-layout.js` does not exist.

- [ ] **Step 3: Implement the pure layout function**

Expose `getPhotoLayout(width, height)` from a browser/CommonJS module. Return `{ kind, ratio, extreme }`, using thresholds `<0.82` portrait, `0.82–1.18` square, `1.18–1.70` landscape, and `>1.70` wide. Clamp the CSS ratio to `0.58–1.78`; invalid dimensions return `{ kind: 'landscape', ratio: 4 / 3, extreme: false }`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test --test-isolation=none birthday1/adaptive-layout.test.js`

Expected: all classification tests PASS.

- [ ] **Step 5: Add browser image observation**

Add `applyPhotoLayout(img)` and `startAdaptiveLayout(document)` to the same module. Decode each image, recheck that its source has not changed, set `photo-{kind}`, `--photo-ratio`, `--photo-bg`, `data-photo-ready`, and `data-photo-extreme`, and observe both child additions and `src` changes under `#photoZone`.

- [ ] **Step 6: Commit**

Run:

```text
git add birthday1/adaptive-layout.js birthday1/adaptive-layout.test.js
git commit -m "test: define adaptive birthday photo ratios"
```

### Task 2: Test and implement the maximally shared loader

**Files:**
- Create: `birthday1/bootstrap.test.js`
- Create: `birthday1/bootstrap.js`
- Create: `birthday1/index.html`

- [ ] **Step 1: Write the failing markup-preparation tests**

Test that `prepareBirthdayMarkup(html)` extracts the source body, removes source script tags, rewrites `assets/happy_birthday_fallback.wav` to `/birthday/assets/happy_birthday_fallback.wav`, and rewrites `href="upload/"` to `href="/birthday/upload/"`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --test-isolation=none birthday1/bootstrap.test.js`

Expected: FAIL because `bootstrap.js` does not exist.

- [ ] **Step 3: Implement the loader**

Expose `prepareBirthdayMarkup(html)` for tests. In browsers, fetch `/birthday/index.html`, inject the prepared body, set `document.body.dataset.adaptivePhotos = '1'`, and load these scripts sequentially:

```text
https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
/birthday/config.js
/birthday/shared.js
/birthday/photo-pool.js
/birthday1/adaptive-layout.js
/birthday/viewer.js
```

Reveal the page only after the shared viewer script loads. On failure, show a concise load error and log the underlying exception.

- [ ] **Step 4: Create the minimal entry page**

Create `birthday1/index.html` with the production title and viewport, `/birthday/style.css`, `adaptive-layout.css`, a hidden-until-ready rule, a loading message, and `bootstrap.js`.

- [ ] **Step 5: Run tests and syntax checks**

Run:

```text
node --test --test-isolation=none birthday1/adaptive-layout.test.js birthday1/bootstrap.test.js
node --check birthday1/adaptive-layout.js
node --check birthday1/bootstrap.js
```

Expected: all tests PASS and syntax checks exit 0.

- [ ] **Step 6: Commit**

Run:

```text
git add birthday1/bootstrap.js birthday1/bootstrap.test.js birthday1/index.html
git commit -m "feat: add shared birthday1 test entry"
```

### Task 3: Add birthday1-only adaptive layout CSS

**Files:**
- Create: `birthday1/adaptive-layout.css`

- [ ] **Step 1: Add scoped adaptive frame rules**

Under `body[data-adaptive-photos="1"]`, hide unclassified cards, preserve `--photo-ratio`, use tall/narrow portrait frames, proportional square/landscape/wide frames, constrain all frames to the photo zone, and retain the original card borders, shadows, rotations, and swap transitions.

- [ ] **Step 2: Add extreme-ratio containment**

For `data-photo-extreme="1"`, render the image with `object-fit: contain` over a blurred `--photo-bg` pseudo-background. Normal photos use `object-fit: cover` inside a frame matching their natural ratio, so no meaningful crop occurs.

- [ ] **Step 3: Add mobile constraints**

At `max-width:760px`, cap portrait height and all card widths so the viewer remains inside the viewport without horizontal overflow.

- [ ] **Step 4: Run static checks and commit**

Run `git diff --check`, then:

```text
git add birthday1/adaptive-layout.css
git commit -m "feat: adapt birthday1 frames to photo orientation"
```

### Task 4: Local integration verification

**Files:**
- No additional files.

- [ ] **Step 1: Serve the repository root locally**

Use the existing local server or start one at `127.0.0.1` from the repository root.

- [ ] **Step 2: Verify shared-resource routing**

Confirm `/birthday1/` loads `/birthday/index.html`, `/birthday/style.css`, `/birthday/config.js`, `/birthday/shared.js`, `/birthday/photo-pool.js`, and `/birthday/viewer.js`; confirm its upload link is `/birthday/upload/`.

- [ ] **Step 3: Verify layout combinations**

Use controlled portrait, square, landscape, and wide image sources to confirm classification, preserved ratio, five-card bounds, and realtime `src` replacement handling.

- [ ] **Step 4: Verify isolation**

Confirm `git diff cc56199 -- birthday/` includes only the already-deployed photo-pool work and that this feature adds no new changes under `birthday/`.

### Task 5: Deploy and production verification

**Files:**
- No additional files.

- [ ] **Step 1: Push the commits**

Run `git push origin main` and wait until `https://zeror.ca/birthday1/` and its two overlay assets return 200.

- [ ] **Step 2: Insert controlled mixed-orientation rows**

Insert temporary Supabase rows containing five safe data-URL SVGs with portrait, square, landscape, and wide dimensions. Keep `/birthday/` and `/birthday1/` open simultaneously.

- [ ] **Step 3: Verify database sharing and isolation**

Confirm both viewers receive the same rows, `/birthday/` stays fixed at 4:3 with no adaptive classes, and `/birthday1/` assigns the expected adaptive classes and ratios without refresh.

- [ ] **Step 4: Verify realtime latency and replacement**

Insert one additional portrait row while `/birthday1/` remains open, measure response-to-visible time, verify its portrait class, and confirm the page URL did not change.

- [ ] **Step 5: Verify responsive, audio, rotation, and loop behavior**

Check 320, 360, 390, 414, and 430 pixels for horizontal overflow; play music and confirm its clock advances; verify photo movement; monitor 184 seconds and confirm all six scenes plus return to opening.

- [ ] **Step 6: Remove all temporary rows**

Delete only the orientation-test rows through the Supabase SQL editor and confirm the table returns to its prior state.

- [ ] **Step 7: Final completion audit**

Run both Node test files, syntax checks, credential scans, production HTTP checks, Supabase REST checks, remote-commit equality, and clean-worktree verification. Report the `/birthday1/` URL and any unresolved issues.
