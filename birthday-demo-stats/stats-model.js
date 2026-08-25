(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayStatsModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SCENES = new Set(['opening', 'labubu', 'spider', 'football', 'mixed', 'finale']);

  function safeNumber(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function formatDuration(value) {
    const seconds = safeNumber(value);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes < 60) return `${minutes}m${remainder ? ` ${remainder}s` : ''}`;
    const hours = Math.floor(minutes / 60);
    const minuteRemainder = minutes % 60;
    return `${hours}h${minuteRemainder ? ` ${minuteRemainder}m` : ''}`;
  }

  function formatTorontoDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function formatScene(value) {
    return SCENES.has(value) ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Unknown';
  }

  function normalizeSession(value = {}) {
    return {
      sessionId: String(value.session_id || ''),
      startedAt: value.started_at || null,
      lastSeenAt: value.last_seen_at || null,
      endedAt: value.ended_at || null,
      durationSeconds: safeNumber(value.duration_seconds),
      lastScene: SCENES.has(value.last_scene) ? value.last_scene : 'unknown',
      status: value.status === 'live' ? 'Live' : 'Finished'
    };
  }

  function normalizeStats(value = {}) {
    const summary = value.summary || {};
    return {
      generatedAt: value.generated_at || null,
      summary: {
        liveNow: safeNumber(summary.live_now),
        todayOpens: safeNumber(summary.today_opens),
        todayWatchSeconds: safeNumber(summary.today_watch_seconds),
        totalOpens: safeNumber(summary.total_opens),
        totalWatchSeconds: safeNumber(summary.total_watch_seconds),
        averageSessionSeconds: safeNumber(summary.average_session_seconds)
      },
      liveSessions: Array.isArray(value.live_sessions) ? value.live_sessions.map(normalizeSession) : [],
      recentSessions: Array.isArray(value.recent_sessions) ? value.recent_sessions.map(normalizeSession) : []
    };
  }

  return { formatDuration, formatTorontoDateTime, formatScene, normalizeStats };
});
