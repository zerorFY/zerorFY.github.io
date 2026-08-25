const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = path => {
  try { return readFileSync(join(root, path), 'utf8'); } catch { return ''; }
};

test('stats migration exposes only a keyed read-only RPC', () => {
  const sql = read('birthday-demo/ADD_STATS.sql');
  assert.match(sql, /create table if not exists public\.birthday_stats_access/i);
  assert.match(sql, /birthday_stats_access enable row level security/i);
  assert.match(sql, /access_key_hash bytea/i);
  assert.match(sql, /create or replace function public\.birthday_usage_stats\(\s*p_access_key text,\s*p_recent_limit integer default 12/is);
  assert.match(sql, /STATS_ACCESS_DENIED/);
  assert.match(sql, /digest\(p_access_key, 'sha256'\)/i);
  assert.match(sql, /perform public\.birthday_usage_close_stale\(\)/i);
  assert.match(sql, /America\/Toronto/);
  assert.match(sql, /least\(50, greatest\(1, p_recent_limit\)\)/i);
  assert.match(sql, /revoke all on table public\.birthday_stats_access from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.birthday_usage_stats\(text, integer\) to anon/i);
  assert.doesNotMatch(sql, /create policy[^;]*birthday_stats_access/is);
});

test('stats route is locked, complete, English-only, and unlinked', () => {
  const html = read('birthday-demo-stats/index.html');
  const js = read('birthday-demo-stats/stats.js');
  const viewer = read('birthday-demo/index.html');
  const upload = read('birthday-demo-upload/index.html');
  for (const label of ['Live Now', 'Today Opens', 'Today Watch Time', 'Total Opens', 'Total Watch Time', 'Average Session', 'Current Sessions', 'Recent Sessions']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /type="password"/);
  assert.match(html, /\/birthday-demo\/config\.js/);
  assert.match(html, /stats-model\.js/);
  assert.match(html, /stats\.js/);
  assert.doesNotMatch(html + js, /[\u3400-\u9fff]/);
  assert.doesNotMatch(viewer + upload, /birthday-demo-stats/i);
  assert.match(js, /POLL_MS\s*=\s*5000/);
  assert.match(js, /sessionStorage/);
  assert.match(js, /birthday_usage_stats/);
  assert.match(js, /p_recent_limit:\s*12/);
  assert.match(js, /inFlight/);
  assert.doesNotMatch(html, /href=["'][^"']*birthday-demo/i);
});

test('stats source and deployment docs never publish the configured access key', () => {
  const protectedFiles = [
    read('birthday-demo-stats/index.html'),
    read('birthday-demo-stats/stats.js'),
    read('birthday-demo/ADD_STATS.sql'),
    read('docs/superpowers/specs/2026-08-24-birthday-demo-stats-design.md'),
    read('docs/superpowers/plans/2026-08-24-birthday-demo-stats.md')
  ].join('\n');
  assert.doesNotMatch(protectedFiles, /\bfreya\b/i);
});
