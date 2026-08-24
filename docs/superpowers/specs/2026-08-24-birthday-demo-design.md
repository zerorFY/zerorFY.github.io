# Birthday Demo Design

## Goal

Publish a generic birthday experience for children age 8 without any Maxwell branding. The desktop display lives at `/birthday-demo/`, and the phone uploader lives at `/birthday-demo-upload/`.

## Architecture

Keep the existing static HTML, CSS, and JavaScript architecture with the existing Supabase project, `birthday_photos` table, `maxwell-birthday` storage bucket, and Realtime channel. Create two new top-level route folders so neither new route depends on the old `/birthday/` URL at runtime.

The viewer incorporates the tested adaptive photo-frame behavior from `/birthday1/`: portrait, square, landscape, and wide images receive orientation-specific frames; extreme aspect ratios use a blurred background instead of cropping the subject.

## Viewer

- Route: `/birthday-demo/`.
- Remove every visible and metadata reference to Maxwell.
- Use `HAPPY 8TH BIRTHDAY` and generic `CHILDREN'S PARTY` wording.
- Keep the current three-minute animation, music, football, confetti, web, light, and photo-wall behavior.
- Keep five visible photo frames and the existing prioritized realtime rotation.
- Apply the adaptive portrait layout directly, without loading `/birthday/` or `/birthday1/`.
- When all cloud photos are deleted, replace every uploaded image with built-in themed visuals immediately.

## Uploader

- Route: `/birthday-demo-upload/`.
- Keep the large multi-photo mobile picker, progress display, and per-file upload status.
- Link back to `/birthday-demo/`.
- Add a secondary `END PARTY` control below the upload interface.
- Require a confirmation dialog that states all party photos will be permanently deleted.
- Disable the control and show progress while deletion is running.
- On success, clear previews and show that the party photos were deleted.
- On partial or complete failure, show an error and allow retry.

## Photo deletion

Deletion is deliberately limited to the existing single-room birthday photo pool:

1. Read every row from `birthday_photos`.
2. Delete the listed objects from the `maxwell-birthday` bucket.
3. Delete every row from `birthday_photos`.
4. Realtime `DELETE` events cause open viewers to rebuild the pool from remaining cloud rows and built-in visuals.

The Supabase setup adds anonymous delete policies only for this dedicated table and bucket because the pilot has no account system. No built-in site assets are stored in that bucket, so they are outside the deletion scope.

Before publishing the new experience, run this same deletion operation once to remove all photos from the previous Maxwell party. Verify that both the table and bucket contain no remaining party uploads.

## Testing

- Unit-test route configuration, generic wording, deletion sequencing, deletion errors, and realtime pool reset.
- Preserve and run the existing photo-pool and adaptive-layout tests.
- Serve the repository locally and verify both new routes return successfully.
- Check the viewer at 1920×1080 and the uploader at 320, 375, 390, and 430 CSS pixels.
- Verify no Maxwell text appears in either new route.
- Verify upload, realtime appearance, portrait framing, `END PARTY`, and fallback restoration.
- After deployment, verify both production URLs and confirm the old photo pool is empty.

## Deployment

Commit only scoped repository changes, push the existing `main` branch to its configured origin, wait for GitHub Pages, and verify:

- `https://zeror.ca/birthday-demo/`
- `https://zeror.ca/birthday-demo-upload/`

