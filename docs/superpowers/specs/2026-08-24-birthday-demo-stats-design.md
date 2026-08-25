# Birthday Demo Internal Stats Design

## Goal

Add an unlinked, shared-key-protected, read-only statistics page at `/birthday-demo-stats/` for validating real usage of `/birthday-demo/`. The page has no account system and is intentionally minimal. Neither the birthday viewer nor the photo uploader links to it.

## Access Model

The route is discoverable only by knowing its URL and requires the configured shared access key. The key is never embedded in page source, a URL, or the Git repository. The page asks for it when opened and keeps it only in `sessionStorage`, so closing the tab ends the unlocked browser session.

The database stores only a SHA-256 digest of the key in a private configuration table with row-level security and no anonymous policies. The actual key is configured once directly in Supabase during deployment rather than committed to source control. Anonymous clients keep no direct table access. They can execute only a narrow, read-only security-definer statistics RPC, which rejects a missing or incorrect key before returning data.

## Data Source and Time Zone

The existing `public.birthday_usage_sessions` table remains the single source of truth. All “Today” boundaries use PostgreSQL's `America/Toronto` time zone, including daylight-saving changes. Total metrics cover every stored session.

The statistics RPC calls `birthday_usage_close_stale()` before calculating results. A session with no heartbeat for at least 90 seconds is assigned `ended_at = last_seen_at`. This lets polling the statistics page transition abandoned sessions from Live to Finished without cron jobs or another backend.

## Read-only Statistics RPC

Add `public.birthday_usage_stats(p_access_key text, p_recent_limit integer default 12)`, returning one JSON object with:

- `generated_at`;
- summary: `live_now`, `today_opens`, `today_watch_seconds`, `total_opens`, `total_watch_seconds`, and `average_session_seconds`;
- `live_sessions`: every currently live session, newest first;
- `recent_sessions`: the newest completed and live sessions, limited to 1–50 rows and defaulting to 12.

Each session item contains only `session_id`, `started_at`, `last_seen_at`, `ended_at`, `duration_seconds`, `last_scene`, and derived `status`. No personal data is collected or returned.

`duration_seconds` is the authoritative running or finished duration. While live, it changes on the existing approximately 30-second heartbeat. Once stale closure sets `ended_at`, subsequent heartbeat updates are rejected by the existing function and duration remains fixed.

Anonymous clients receive execute permission only for this statistics function. Row-level security stays enabled with no anonymous table read policy. Incorrect-key errors contain no statistics data and use a generic access-denied message.

## Page Structure

Create a standalone `/birthday-demo-stats/` route with three compact sections:

1. Six summary cards: Live Now, Today Opens, Today Watch Time, Total Opens, Total Watch Time, and Average Session.
2. Current Sessions: one compact card per live session with Started, Running Time, Current Scene, and Last Heartbeat. Show a quiet empty state when no session is live.
3. Recent Sessions: a small table showing Started, Duration, Last Scene, and Status for the latest 12 sessions.

The page initially displays only a compact access-key form. After successful validation it displays the statistics dashboard. It is English-only, responsive, and visually minimal. It displays the Toronto reporting time zone and the last refresh time. It contains no photo controls, analytics configuration, charts, user identity, or navigation back to the public routes.

## Refresh and Error Handling

After a key is submitted, the page fetches immediately and then every five seconds. Only one request may be in flight at a time. An access-denied response clears the saved key and returns to the locked form. Any other failed request leaves the last successful data visible, marks the page as unable to refresh, and retries on the next interval. Durations are formatted as compact human-readable time without client-side extrapolation, so displayed values always match persisted heartbeat data.

## Files and Boundaries

- `birthday-demo/ADD_STATS.sql`: idempotent RPC migration and grants.
- `birthday-demo-stats/index.html`: standalone semantic page shell.
- `birthday-demo-stats/style.css`: responsive minimal presentation.
- `birthday-demo-stats/stats-model.js`: pure normalization and time-formatting functions, reusable in Node tests.
- `birthday-demo-stats/stats.js`: Supabase client, five-second polling, and DOM rendering.
- Contract and unit tests beside the implementation verify SQL permissions, route isolation, metric mapping, formatting, and rendering states.

## Acceptance Verification

After migration and deployment:

1. Confirm an incorrect key reveals no statistics, then unlock the page with the configured key.
2. Record the current Today Opens value, open `/birthday-demo/`, and confirm Today Opens increases by exactly one without waiting for a heartbeat.
3. Keep the viewer open for more than 30 seconds and confirm Running Time and Current Scene update after a heartbeat.
4. Close the viewer, keep the stats page polling, and confirm the session becomes Finished after approximately 90 seconds and its duration stops changing.
5. Open the viewer again and confirm a distinct new session appears and Today Opens increases again.
6. Confirm no stats link exists in either `/birthday-demo/` or `/birthday-demo-upload/`.
7. Run the complete automated test suite and verify the published routes directly.
