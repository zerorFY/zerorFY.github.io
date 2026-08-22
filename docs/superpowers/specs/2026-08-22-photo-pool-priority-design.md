# Maxwell Birthday Photo Pool Priority Design

## Goal

Keep exactly five photo positions populated while prioritizing uploaded photos over the built-in Labubu, Spider-Man, and football cards.

## Photo-pool rules

- With no uploaded photos, fill all five positions by cycling through the three built-in cards.
- With one to four uploaded photos, show every uploaded photo and use built-in cards only for the remaining positions.
- With five or more uploaded photos, use uploaded photos exclusively. Built-in cards must not appear during initial rendering or later rotation.
- Uploaded URLs are unique within the pool. Realtime inserts are added to the front and must not create duplicates.
- Every render contains five photo elements. When more than five uploaded photos exist, the existing rotation continues through the full uploaded-photo pool.

## Realtime behavior

The initial Supabase query builds the pool using the rules above. Each realtime insert updates the uploaded-photo collection, rebuilds the effective pool, and immediately swaps the new photo into one visible position without refreshing the page.

## Defaults and failures

The only built-in photo cards are Labubu, Spider-Man, and football. A failed uploaded image may fall back to a built-in card so that the layout is not broken; successful uploaded images never fall back unnecessarily.

## Data cleanup

Remove the twelve acceptance-test SVG objects whose names end in `realtime-1.svg`, `realtime-2.svg`, or `realtime-3.svg`, and remove their corresponding `birthday_photos` rows. The four phone-upload JPEG test objects and rows have already been removed.

## Preserved behavior

Do not change the animation design, scene timing, 2.8-second photo rotation interval, music behavior, responsive layout, or 180-second loop.

## Verification

- Automated tests cover 0, 1, 4, 5, and more-than-5 uploaded-photo cases.
- Verify that four uploaded photos produce four uploads plus one default across five visible positions.
- Verify that five or more uploaded photos produce no default cards.
- Verify a realtime insert updates the desktop without refresh.
- Re-run online viewport, music, rotation, and 180-second-loop checks after deployment.
