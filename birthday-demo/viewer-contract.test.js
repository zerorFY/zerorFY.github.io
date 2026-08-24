const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('viewer uses generic modules and reloads the pool after realtime deletion', () => {
  const source = read('birthday-demo/viewer.js');

  assert.match(source, /window\.BirthdayPartyStore/);
  assert.match(source, /window\.BirthdayPhotoPool/);
  assert.match(source, /api\.subscribe\(handleInsert,\s*scheduleReload\)/);
  assert.match(source, /async function reloadCloudPhotos/);
  assert.doesNotMatch(source, /Maxwell/);
});

test('uploader requires dialog confirmation before deleting every party photo', () => {
  const source = read('birthday-demo-upload/upload.js');

  assert.match(source, /endPartyDialog\.showModal\(\)/);
  assert.match(source, /confirmEndPartyBtn\.addEventListener/);
  assert.match(source, /api\.deleteAllPhotos\(\)/);
  assert.doesNotMatch(source, /Maxwell/);
});
