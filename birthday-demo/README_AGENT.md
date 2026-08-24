# Birthday Demo deployment

## Routes

- Viewer: `https://zeror.ca/birthday-demo/`
- Mobile uploader: `https://zeror.ca/birthday-demo-upload/`

## Backend

Both routes use the existing Supabase `birthday_photos` table and the dedicated `maxwell-birthday` storage bucket. Browser code contains only the public anon key.

Run `ADD_DELETE_POLICIES.sql` once in the Supabase SQL Editor before enabling `END PARTY`. The migration is idempotent and grants anonymous delete access only to the birthday table and dedicated bucket.

## END PARTY

The uploader requires confirmation, deletes every storage object referenced by the current photo rows, then deletes those exact table rows. Open viewers receive Realtime delete notifications, reload the pool, and return to built-in themed visuals.

## Verification

```text
node --test --test-isolation=none birthday-demo/*.test.js birthday1/*.test.js birthday/*.test.js
```

Verify the viewer at 1920×1080 and the uploader at widths 320, 375, 390, and 430 pixels. The new user-facing routes must contain no Maxwell wording.
