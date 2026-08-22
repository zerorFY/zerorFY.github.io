# Maxwell Birthday — deployment framework

## Target URLs
- Viewer: `https://zeror.ca/birthday/`
- Mobile uploader: `https://zeror.ca/birthday/upload/`

## Architecture
Static frontend + Supabase Storage + Supabase Postgres + Realtime.
No login, no privacy gate, no CMS.

## Deploy steps
1. Create/use a Supabase project.
2. Run `SUPABASE_SETUP.sql` in SQL Editor.
3. Create a **public** Storage bucket named `maxwell-birthday`.
4. In `config.js`, fill `supabaseUrl` and **anon** key. Never put service_role in frontend code.
5. Deploy this entire folder to the `/birthday/` path on zeror.ca, preserving the `upload/` subfolder.
6. Verify from two devices:
   - Desktop opens `/birthday/` and shows `LIVE PHOTO WALL`.
   - Phone opens `/birthday/upload/`.
   - Upload 3 photos on phone.
   - Desktop receives them without refresh and rotates them into the five visible photo cards.
7. Verify music, opening animation and the full 180-second loop still run.

## Acceptance checks
- Mobile width 320–430px: upload button is full width and at least ~230px tall.
- Can select multiple photos in one phone picker action.
- Each uploaded photo gets an on-screen ✓ or failure marker.
- Viewer keeps Labubu / Spider-Man defaults when cloud pool is empty.
- New uploaded photo appears on viewer within a few seconds without manual refresh.
- Viewer photo rotation continues every ~2.8s.
- Never expose Supabase `service_role` key.

## Files
- `index.html`, `style.css`, `viewer.js`: party viewer.
- `upload/index.html`, `upload/upload.css`, `upload/upload.js`: mobile uploader.
- `shared.js`: Supabase adapter shared by both pages.
- `config.js`: deployment config.
- `SUPABASE_SETUP.sql`: table/RLS/realtime setup.
