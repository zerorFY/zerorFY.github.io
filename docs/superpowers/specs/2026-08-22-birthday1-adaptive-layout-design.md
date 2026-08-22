# Birthday1 Adaptive Photo Layout Design

## Goal

Create `https://zeror.ca/birthday1/` as a temporary adaptive-photo-layout test page while leaving `https://zeror.ca/birthday/` unchanged.

## Shared foundation

`birthday1` must reuse the existing production resources by absolute `/birthday/` URLs:

- `config.js` and the same Supabase project
- `shared.js`, `photo-pool.js`, and `viewer.js`
- `style.css` and the fallback audio asset
- the `birthday_photos` table and `maxwell-birthday` Storage bucket
- realtime subscriptions, music, photo rotation, animation design, and the 180-second scene loop

The existing upload button on `birthday1` links to `/birthday/upload/`. There is no `/birthday1/upload/` page.

## Birthday1-only files

- `birthday1/index.html`: a test entry page with the same scene markup as the production viewer, absolute references to shared `/birthday/` resources, and a `data-adaptive-photos` marker.
- `birthday1/adaptive-layout.js`: observes photo elements created by the shared viewer, reads each loaded image's natural dimensions, and classifies it as portrait, square, landscape, or wide.
- `birthday1/adaptive-layout.css`: overrides only photo-frame dimensions and position constraints under the `data-adaptive-photos` marker.

## Adaptive behavior

- Preserve each normal photo's natural aspect ratio without forcing it into 4:3.
- Portrait photos become narrower and taller, using the available vertical space.
- Square and landscape photos receive proportionate frames.
- Very wide or extremely tall images are constrained to safe minimum and maximum aspect ratios; they use a blurred same-image background or `contain` treatment so important content is not cropped.
- Five position anchors remain, but portrait-aware size limits and offsets prevent the cards from colliding with the title, progress bar, and controls.
- Classification happens after image decoding and before the card is revealed where possible, preventing a visible horizontal-to-vertical jump.
- A `MutationObserver` classifies both initial cards and cards recreated after Supabase realtime updates.

## Isolation and promotion

No production `/birthday/` JavaScript or CSS behavior changes during the test. If the test is accepted, the two adaptive overlay files can be loaded by `/birthday/`, and the temporary `birthday1` entry can then be removed.

## Verification

- Confirm `/birthday/` remains byte-for-byte unchanged except for repository documentation.
- Test five portrait/landscape combinations, including all portrait and mixed sets.
- Verify initial Supabase hydration and realtime replacements are classified.
- Verify no overlap with title, controls, or progress bar at desktop sizes.
- Verify `/birthday1/` at mobile widths has no horizontal overflow.
- Reconfirm music, scene transitions, photo rotation, and the full 180-second loop.
- Confirm `/birthday1/` upload control links to `/birthday/upload/` and both pages read the same Supabase photo collection.
