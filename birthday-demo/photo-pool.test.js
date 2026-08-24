const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPhotoPool } = require('./photo-pool.js');

const defaults = ['labubu', 'spider-man', 'football'];

test('fills five positions with defaults when there are no uploads', () => {
  const pool = buildPhotoPool([], defaults);
  assert.equal(pool.length, 5);
  assert.deepEqual(pool, ['labubu', 'spider-man', 'football', 'labubu', 'spider-man']);
});

test('keeps one upload and fills the other four positions with defaults', () => {
  const pool = buildPhotoPool(['upload-1'], defaults);
  assert.equal(pool.length, 5);
  assert.equal(pool[0], 'upload-1');
  assert.equal(pool.filter(item => defaults.includes(item)).length, 4);
});

test('keeps four uploads and uses exactly one default', () => {
  const uploads = ['upload-1', 'upload-2', 'upload-3', 'upload-4'];
  const pool = buildPhotoPool(uploads, defaults);
  assert.equal(pool.length, 5);
  assert.deepEqual(pool.slice(0, 4), uploads);
  assert.equal(pool.filter(item => defaults.includes(item)).length, 1);
});

test('uses only uploads when five photos exist', () => {
  const uploads = ['upload-1', 'upload-2', 'upload-3', 'upload-4', 'upload-5'];
  assert.deepEqual(buildPhotoPool(uploads, defaults), uploads);
});

test('keeps the full upload rotation pool when more than five photos exist', () => {
  const uploads = ['upload-1', 'upload-2', 'upload-3', 'upload-4', 'upload-5', 'upload-6'];
  assert.deepEqual(buildPhotoPool(uploads, defaults), uploads);
});
