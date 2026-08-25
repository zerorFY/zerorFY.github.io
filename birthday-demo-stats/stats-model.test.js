const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatDuration,
  formatTorontoDateTime,
  formatScene,
  normalizeStats
} = require('./stats-model.js');

test('formats persisted durations compactly', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(65), '1m 5s');
  assert.equal(formatDuration(3661), '1h 1m');
});

test('formats timestamps in Toronto time', () => {
  assert.match(formatTorontoDateTime('2026-01-15T15:30:00Z'), /Jan 15, 2026.*10:30/);
  assert.equal(formatTorontoDateTime(null), '—');
});

test('formats only known birthday scenes', () => {
  assert.equal(formatScene('opening'), 'Opening');
  assert.equal(formatScene('spider'), 'Spider');
  assert.equal(formatScene('finale'), 'Finale');
  assert.equal(formatScene('anything-else'), 'Unknown');
});

test('normalizes missing data and session status', () => {
  assert.deepEqual(normalizeStats({}), {
    generatedAt: null,
    summary: {
      liveNow: 0,
      todayOpens: 0,
      todayWatchSeconds: 0,
      totalOpens: 0,
      totalWatchSeconds: 0,
      averageSessionSeconds: 0
    },
    liveSessions: [],
    recentSessions: []
  });

  const result = normalizeStats({
    generated_at: '2026-08-25T00:00:00Z',
    summary: { live_now: '1', total_opens: 4 },
    live_sessions: [{ session_id: 'a', duration_seconds: '31', last_scene: 'mixed', status: 'live' }],
    recent_sessions: [{ session_id: 'b', duration_seconds: 8, last_scene: 'opening', status: 'finished' }]
  });
  assert.equal(result.summary.liveNow, 1);
  assert.equal(result.summary.totalOpens, 4);
  assert.equal(result.liveSessions[0].status, 'Live');
  assert.equal(result.liveSessions[0].durationSeconds, 31);
  assert.equal(result.recentSessions[0].status, 'Finished');
});
