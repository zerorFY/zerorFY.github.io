const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('new routes are generic and linked to each other', () => {
  const viewer = read('birthday-demo/index.html');
  const uploader = read('birthday-demo-upload/index.html');

  assert.match(viewer, /HAPPY 8TH BIRTHDAY/i);
  assert.match(uploader, /CHILDREN'S PARTY/i);
  assert.match(viewer, /href="\/birthday-demo-upload\/"/);
  assert.match(uploader, /href="\/birthday-demo\/"/);
  assert.doesNotMatch(viewer + uploader, /maxwell/i);
});

test('uploader includes a confirmed END PARTY action', () => {
  const uploader = read('birthday-demo-upload/index.html');

  assert.match(uploader, /id="endPartyBtn"/);
  assert.match(uploader, /id="endPartyDialog"/);
  assert.match(uploader, /permanently deleted/i);
});

test('delete-policy migration is idempotent and bucket-scoped', () => {
  const sql = read('birthday-demo/ADD_DELETE_POLICIES.sql');

  assert.match(sql, /drop policy if exists "birthday photos public delete"/i);
  assert.match(sql, /drop policy if exists "birthday storage public delete"/i);
  assert.match(sql, /bucket_id = 'maxwell-birthday'/i);
  assert.doesNotMatch(sql, /alter publication/i);
});

test('photo-limit notice is English and hidden until an over-capacity attempt', () => {
  const uploader = read('birthday-demo-upload/index.html');
  const source = read('birthday-demo-upload/upload.js');

  assert.match(uploader, /<script src="\/birthday-demo\/photo-capacity\.js"><\/script>/);
  assert.match(uploader, /id="photoLimitNotice"[^>]*hidden/);
  assert.match(uploader, /Photo limit reached — this demo supports up to 20 photos\./);
  assert.match(source, /api\.getPhotoCount\(\)/);
  assert.match(source, /capacity\.planPhotoBatch/);
  assert.match(source, /limitNotice\.hidden = false/);
});

test('all user-facing demo markup and scripts contain no Chinese text', () => {
  const paths = [
    'birthday-demo/index.html',
    'birthday-demo/viewer.js',
    'birthday-demo/usage-counter.js',
    'birthday-demo-upload/index.html',
    'birthday-demo-upload/upload.js'
  ];
  const source = paths.map(read).join('\n');
  assert.doesNotMatch(source, /[\u3400-\u9fff]/u);
});

test('usage and limit migration is private, idempotent, and database-enforced', () => {
  const sql = read('birthday-demo/ADD_USAGE_AND_LIMIT.sql');

  assert.match(sql, /create table if not exists public\.birthday_usage_sessions/i);
  assert.match(sql, /alter table public\.birthday_usage_sessions enable row level security/i);
  assert.doesNotMatch(sql, /create policy[^;]*birthday_usage_sessions/is);
  assert.match(sql, /create or replace function public\.birthday_usage_start/is);
  assert.match(sql, /create or replace function public\.birthday_usage_heartbeat/is);
  assert.match(sql, /security definer/is);
  assert.match(sql, /interval '90 seconds'/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /count\(\*\)[\s\S]*>= 20/i);
  assert.match(sql, /BIRTHDAY_PHOTO_LIMIT_REACHED/);
  assert.match(sql, /grant execute on function public\.birthday_usage_start[^;]*to anon/is);
  assert.match(sql, /grant execute on function public\.birthday_usage_heartbeat[^;]*to anon/is);
  assert.match(sql, /bucket_id = 'maxwell-birthday'/i);
});
