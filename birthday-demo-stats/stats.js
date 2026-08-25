(function () {
  const POLL_MS = 5000;
  const STORAGE_KEY = 'birthday-demo-stats-key';
  const cfg = window.BIRTHDAY_DEMO_CONFIG || {};
  const model = window.BirthdayStatsModel;
  const client = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;
  const byId = id => document.getElementById(id);
  const lockPanel = byId('lockPanel');
  const dashboard = byId('dashboard');
  const accessForm = byId('accessForm');
  const accessInput = byId('accessKey');
  const accessError = byId('accessError');
  const refreshStatus = byId('refreshStatus');
  let accessKey = sessionStorage.getItem(STORAGE_KEY) || '';
  let inFlight = false;

  function setText(id, value) { byId(id).textContent = String(value); }

  function makeCell(row, value, className) {
    const cell = document.createElement('td');
    cell.textContent = value;
    if (className) cell.className = className;
    row.appendChild(cell);
  }

  function render(stats) {
    const { formatDuration, formatTorontoDateTime, formatScene } = model;
    setText('liveNow', stats.summary.liveNow);
    setText('todayOpens', stats.summary.todayOpens);
    setText('todayWatchTime', formatDuration(stats.summary.todayWatchSeconds));
    setText('totalOpens', stats.summary.totalOpens);
    setText('totalWatchTime', formatDuration(stats.summary.totalWatchSeconds));
    setText('averageSession', formatDuration(stats.summary.averageSessionSeconds));

    const liveRoot = byId('liveSessions');
    liveRoot.replaceChildren();
    stats.liveSessions.forEach(session => {
      const card = document.createElement('article');
      card.className = 'session-card';
      const values = [
        ['Started', formatTorontoDateTime(session.startedAt)],
        ['Running Time', formatDuration(session.durationSeconds)],
        ['Current Scene', formatScene(session.lastScene)],
        ['Last Heartbeat', formatTorontoDateTime(session.lastSeenAt)]
      ];
      const list = document.createElement('dl');
      values.forEach(([label, value]) => {
        const group = document.createElement('div');
        const term = document.createElement('dt');
        const detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = value;
        group.append(term, detail);
        list.appendChild(group);
      });
      card.appendChild(list);
      liveRoot.appendChild(card);
    });
    byId('noLiveSessions').hidden = stats.liveSessions.length > 0;

    const recentRoot = byId('recentSessions');
    recentRoot.replaceChildren();
    stats.recentSessions.forEach(session => {
      const row = document.createElement('tr');
      makeCell(row, formatTorontoDateTime(session.startedAt));
      makeCell(row, formatDuration(session.durationSeconds));
      makeCell(row, formatScene(session.lastScene));
      makeCell(row, session.status, session.status === 'Live' ? 'status-live' : '');
      recentRoot.appendChild(row);
    });
    byId('noRecentSessions').hidden = stats.recentSessions.length > 0;
    refreshStatus.textContent = `Updated ${formatTorontoDateTime(stats.generatedAt)} · refreshes every 5s`;
  }

  function showLocked(message) {
    dashboard.hidden = true;
    lockPanel.hidden = false;
    accessError.hidden = !message;
    accessError.textContent = message || '';
    accessInput.focus();
  }

  async function refresh() {
    if (!accessKey || !client || !model || inFlight) return;
    inFlight = true;
    try {
      const { data, error } = await client.rpc('birthday_usage_stats', {
        p_access_key: accessKey,
        p_recent_limit: 12
      });
      if (error) throw error;
      render(model.normalizeStats(data));
      lockPanel.hidden = true;
      dashboard.hidden = false;
      accessError.hidden = true;
    } catch (error) {
      if (String(error?.message || '').includes('STATS_ACCESS_DENIED') || error?.code === '28000') {
        accessKey = '';
        sessionStorage.removeItem(STORAGE_KEY);
        showLocked('Access denied. Check the key and try again.');
      } else if (!dashboard.hidden) {
        refreshStatus.textContent = 'Unable to refresh · retrying automatically';
      } else {
        showLocked('Unable to connect. Please try again.');
      }
    } finally {
      inFlight = false;
    }
  }

  accessForm.addEventListener('submit', event => {
    event.preventDefault();
    accessKey = accessInput.value.trim();
    if (!accessKey) return;
    sessionStorage.setItem(STORAGE_KEY, accessKey);
    accessError.hidden = true;
    void refresh();
  });

  if (accessKey) void refresh();
  else showLocked('');
  window.setInterval(() => { void refresh(); }, POLL_MS);
})();
