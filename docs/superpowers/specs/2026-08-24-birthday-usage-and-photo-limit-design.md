# Birthday Usage Counter and Shared Photo Limit Design

## Goal

Extend the live birthday demo with a private background usage counter and a hard limit of 20 uploaded photos across the entire shared party pool. Keep every user-visible string in English.

## Shared 20-photo limit

The 20-photo limit applies to the full `birthday_photos` table, not to one picker action or one phone. Built-in themed visuals do not count toward the limit.

The uploader reads the current row count before processing a selection and calculates the remaining capacity. It uploads only the files that fit. The limit notice is absent from the initial visual state by using the `hidden` attribute and is revealed only when:

- the selected batch contains more files than the remaining capacity;
- the pool already contains 20 photos; or
- a concurrent upload reaches the database limit first.

The English message is:

```text
Photo limit reached — this demo supports up to 20 photos.
```

A database trigger serializes inserts and rejects the 21st row. This prevents two phones from exceeding the shared limit. If Storage upload succeeds but the row insert fails, the client immediately removes that just-uploaded object. A database limit error is converted into the same English limit notice; other errors retain the existing retryable upload behavior.

`END PARTY` continues to remove every object under the dedicated upload prefix, including orphaned objects, and every photo row. After deletion the full 20-photo capacity becomes available again.

## Background usage counter

Only `/birthday-demo/` creates a usage session. `/birthday-demo-upload/` never creates one.

On viewer load, the browser generates a random UUID and calls a narrowly scoped Supabase function to insert one session. Every 30 seconds while the page is visible, the viewer sends:

- session UUID;
- elapsed visible playback seconds;
- current scene: `opening`, `labubu`, `spider`, `football`, `mixed`, or `finale`.

The server stores:

- `session_id`;
- `started_at`;
- `last_seen_at`;
- `ended_at`;
- `duration_seconds`;
- `last_scene`.

A best-effort final heartbeat is sent on `visibilitychange` and `pagehide`, but duration does not depend on it. A maintenance function marks sessions with no heartbeat for at least 90 seconds as ended at their last heartbeat. Session creation and each heartbeat invoke this maintenance function, so stale sessions are closed whenever the display is used again. Owner statistics can be calculated directly in Supabase; the birthday pages expose no stats panel and no public read policy.

## Privacy and security

The counter does not collect names, IP addresses, precise location, phone numbers, email addresses, uploaded-photo content, browser fingerprints, persistent device IDs, or user identities.

The sessions table has Row Level Security enabled with no anonymous table policies. Anonymous browsers can only execute the specific security-definer functions for session start and heartbeat. Function inputs are validated: session IDs must be UUIDs, scene names must be from the fixed allowlist, and duration is clamped to a non-negative integer.

## English-only interface

All text rendered by the viewer and uploader remains English, including photo-limit, deletion, offline, upload, retry, and confirmation states. The background counter renders no text.

## Files and boundaries

- `birthday-demo/usage-counter.js`: session lifecycle, visible elapsed time, heartbeat scheduling, and scene updates.
- `birthday-demo/usage-counter.test.js`: deterministic unit tests with injected clock and transport.
- `birthday-demo/party-store.js`: photo count, rollback, database-limit error mapping, and existing storage/table operations.
- `birthday-demo-upload/upload.js`: capacity-aware batch processing and hidden limit notice.
- `birthday-demo-upload/index.html`: hidden English limit notice.
- `birthday-demo/ADD_USAGE_AND_LIMIT.sql`: idempotent usage schema/functions, insert-limit trigger, and required delete policies.
- Existing viewer animation and adaptive portrait-layout modules remain otherwise unchanged.

## Verification

- Unit-test capacities at 0, 19, and 20 existing photos.
- Unit-test a 25-file selection against an empty pool: 20 accepted and 5 rejected by the UI before upload.
- Unit-test database-limit error mapping and Storage rollback.
- Unit-test one viewer session start, 30-second heartbeats, fixed scene names, hidden-time exclusion, and no uploader session.
- Verify the limit notice is hidden at initial render and becomes visible only after an over-capacity attempt.
- Verify all user-facing HTML and JavaScript contain no Chinese text and no Maxwell wording.
- Apply the migration, permanently clear the previous party's 25 rows and 26 objects, and verify both counts are zero.
- Upload 20 photos successfully, verify the 21st is rejected, run `END PARTY`, and verify the pool returns to zero.
- Republish and verify both production routes.
