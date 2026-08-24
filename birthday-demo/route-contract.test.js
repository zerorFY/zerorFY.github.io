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
