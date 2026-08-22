const test = require('node:test');
const assert = require('node:assert/strict');
const { getPhotoLayout } = require('./adaptive-layout.js');

test('classifies a 9:16 photo as portrait without changing its ratio', () => {
  const layout = getPhotoLayout(900, 1600);
  assert.equal(layout.kind, 'portrait');
  assert.equal(layout.ratio, 9 / 16);
  assert.equal(layout.extreme, false);
});

test('classifies a square photo', () => {
  assert.deepEqual(getPhotoLayout(1000, 1000), {
    kind: 'square',
    ratio: 1,
    extreme: false
  });
});

test('classifies a 4:3 photo as landscape', () => {
  assert.deepEqual(getPhotoLayout(1600, 1200), {
    kind: 'landscape',
    ratio: 4 / 3,
    extreme: false
  });
});

test('classifies a 2:1 photo as wide and safely clamps its frame', () => {
  const layout = getPhotoLayout(2000, 1000);
  assert.equal(layout.kind, 'wide');
  assert.equal(layout.ratio, 16 / 9);
  assert.equal(layout.extreme, true);
});

test('safely clamps an extremely tall image', () => {
  const layout = getPhotoLayout(300, 1600);
  assert.equal(layout.kind, 'portrait');
  assert.equal(layout.ratio, 9 / 16);
  assert.equal(layout.extreme, true);
});

test('uses a stable landscape fallback for invalid dimensions', () => {
  assert.deepEqual(getPhotoLayout(0, 0), {
    kind: 'landscape',
    ratio: 4 / 3,
    extreme: false
  });
});
