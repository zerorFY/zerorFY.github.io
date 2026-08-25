const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createUsageCounter } = require('./usage-counter.js');

function createHarness() {
  let clock = 0;
  const starts = [];
  const heartbeats = [];
  const listeners = new Map();
  const documentRef = {
    visibilityState: 'visible',
    addEventListener(name, handler) { listeners.set(`document:${name}`, handler); }
  };
  const windowRef = {
    addEventListener(name, handler) { listeners.set(`window:${name}`, handler); }
  };
  const transport = {
    async startUsageSession(sessionId, scene) { starts.push({ sessionId, scene }); },
    async heartbeatUsageSession(sessionId, durationSeconds, scene) {
      heartbeats.push({ sessionId, durationSeconds, scene });
    }
  };
  const counter = createUsageCounter({
    transport,
    now: () => clock,
    randomUUID: () => 'session-1',
    documentRef,
    windowRef,
    setIntervalFn: handler => { listeners.set('interval', handler); return 1; },
    clearIntervalFn: () => {}
  });
  return {
    counter,
    starts,
    heartbeats,
    documentRef,
    listeners,
    advance(milliseconds) { clock += milliseconds; }
  };
}

test('starts one session and sends a 30-second heartbeat with the current scene', async () => {
  const harness = createHarness();
  await harness.counter.start();
  harness.counter.setScene('spider');
  harness.advance(30000);
  await harness.counter.heartbeat();

  assert.deepEqual(harness.starts, [{ sessionId: 'session-1', scene: 'opening' }]);
  assert.deepEqual(harness.heartbeats, [
    { sessionId: 'session-1', durationSeconds: 30, scene: 'spider' }
  ]);
  assert.equal(typeof harness.listeners.get('interval'), 'function');
});

test('does not count time while the viewer is hidden', async () => {
  const harness = createHarness();
  await harness.counter.start();
  harness.advance(30000);
  harness.documentRef.visibilityState = 'hidden';
  await harness.counter.handleVisibilityChange();
  harness.advance(60000);
  harness.documentRef.visibilityState = 'visible';
  await harness.counter.handleVisibilityChange();
  harness.advance(30000);
  await harness.counter.heartbeat();

  assert.equal(harness.heartbeats.at(-1).durationSeconds, 60);
});

test('ignores unknown scenes and sends a final page-hide heartbeat', async () => {
  const harness = createHarness();
  await harness.counter.start();
  harness.counter.setScene('unknown');
  harness.advance(12000);
  await harness.counter.handlePageHide();

  assert.deepEqual(harness.heartbeats.at(-1), {
    sessionId: 'session-1',
    durationSeconds: 12,
    scene: 'opening'
  });
});

test('start is idempotent', async () => {
  const harness = createHarness();
  await harness.counter.start();
  await harness.counter.start();
  assert.equal(harness.starts.length, 1);
});

test('browser bootstrap does not require crypto.randomUUID', () => {
  const source = readFileSync(join(__dirname, 'usage-counter.js'), 'utf8');
  assert.match(source, /if \(root\.document && root\.BirthdayPartyStore\?\.ready\)/);
  assert.match(source, /xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx/);
});
