const test = require('node:test');
const assert = require('node:assert/strict');
const { getPhotoLayout, applyPhotoLayout } = require('./adaptive-layout.js');

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

test('reclassifies a swapped image when currentSrc briefly points to the old photo', async () => {
  const classes = new Set(['photo', 'photo-portrait']);
  const attributes = new Map([['data-photo-ready', '1']]);
  const styles = new Map();
  const card = {
    classList: {
      add: (...items) => items.forEach(item => classes.add(item)),
      remove: (...items) => items.forEach(item => classes.delete(item))
    },
    style: { setProperty: (name, value) => styles.set(name, value) },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name)
  };
  const img = {
    src: 'https://example.test/new-landscape.jpg',
    currentSrc: 'https://example.test/old-portrait.jpg',
    naturalWidth: 1920,
    naturalHeight: 1280,
    getAttribute: name => name === 'src' ? 'https://example.test/new-landscape.jpg' : null,
    closest: () => card,
    decode: async function () { this.currentSrc = this.src; }
  };

  const layout = await applyPhotoLayout(img);

  assert.equal(layout.kind, 'landscape');
  assert.equal(classes.has('photo-landscape'), true);
  assert.equal(classes.has('photo-portrait'), false);
  assert.equal(styles.get('--photo-ratio'), '1.5');
  assert.equal(attributes.get('data-photo-ready'), '1');
});
