const test = require('node:test');
const assert = require('node:assert/strict');
const { prepareBirthdayMarkup } = require('./bootstrap.js');

const sourceHtml = `<!doctype html><html><head><script src="head.js"></script></head><body>
  <main id="stage">
    <audio><source src="assets/happy_birthday_fallback.wav" type="audio/wav"></audio>
    <a id="uploadBtn" href="upload/">PHOTOS</a>
  </main>
  <script src="photo-pool.js"></script><script src="viewer.js"></script>
</body></html>`;

test('extracts the production body without copying its script tags', () => {
  const markup = prepareBirthdayMarkup(sourceHtml);
  assert.match(markup, /<main id="stage">/);
  assert.doesNotMatch(markup, /<script/i);
  assert.doesNotMatch(markup, /<body/i);
});

test('rewrites the fallback audio to the shared production asset', () => {
  const markup = prepareBirthdayMarkup(sourceHtml);
  assert.match(markup, /src="\/birthday\/assets\/happy_birthday_fallback\.wav"/);
});

test('keeps the test viewer upload button on the production upload page', () => {
  const markup = prepareBirthdayMarkup(sourceHtml);
  assert.match(markup, /href="\/birthday\/upload\/"/);
});

test('rejects source documents without a body', () => {
  assert.throws(() => prepareBirthdayMarkup('<main></main>'), /body/i);
});
