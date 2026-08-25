# Birthday Demo deployment

## Routes

- Viewer: `https://zeror.ca/birthday-demo/`
- Mobile uploader: `https://zeror.ca/birthday-demo-upload/`
- Internal stats: `https://zeror.ca/birthday-demo-stats/` (intentionally unlinked)

## Backend

Both routes use the existing Supabase `birthday_photos` table and the dedicated `maxwell-birthday` storage bucket. Browser code contains only the public anon key.

Run `ADD_USAGE_AND_LIMIT.sql` in the Supabase SQL Editor. The migration is idempotent and adds the private usage-session RPCs, the database-enforced shared 20-photo limit, and anonymous delete access limited to the birthday table and dedicated bucket.

## Shared photo limit

The entire active party pool supports at most 20 uploaded photos. The uploader preflights remaining capacity, while the database trigger prevents concurrent phones from creating a 21st row. The English limit notice remains hidden until an upload attempt exceeds available capacity.

## Usage counter

Only the viewer starts a random usage session. It sends visible playback duration and the current animation scene every 30 seconds through narrowly scoped RPC functions. The usage table has no anonymous read policy, and the birthday pages show no statistics panel.

Run `ADD_STATS.sql` to add the key-protected, read-only statistics RPC. Configure the shared key digest directly in Supabase rather than committing the plaintext key. The internal page polls every five seconds, calculates Today metrics in `America/Toronto`, and closes sessions after 90 seconds without a heartbeat. The key remains only in the current tab's `sessionStorage`.

## END PARTY

The uploader requires confirmation, deletes every storage object referenced by the current photo rows, then deletes those exact table rows. Open viewers receive Realtime delete notifications, reload the pool, and return to built-in themed visuals.

## Verification

```text
node --test --test-isolation=none birthday-demo-stats/*.test.js birthday-demo/*.test.js birthday1/*.test.js birthday/*.test.js
```

Verify the viewer at 1920×1080 and the uploader at widths 320, 375, 390, and 430 pixels. The new user-facing routes must contain no Maxwell wording.
