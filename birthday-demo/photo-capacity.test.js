const test = require('node:test');
const assert = require('node:assert/strict');
const { planPhotoBatch } = require('./photo-capacity.js');

test('accepts only 20 of 25 files in an empty shared pool', () => {
  const files = Array.from({ length: 25 }, (_, index) => `photo-${index}`);
  const plan = planPhotoBatch(0, files, 20);

  assert.equal(plan.accepted.length, 20);
  assert.equal(plan.rejected.length, 5);
  assert.equal(plan.remaining, 0);
  assert.equal(plan.limitReached, true);
});

test('accepts one file when 19 already exist', () => {
  assert.deepEqual(planPhotoBatch(19, ['a', 'b'], 20), {
    accepted: ['a'],
    rejected: ['b'],
    remaining: 0,
    limitReached: true
  });
});

test('rejects every file when the shared pool already has 20', () => {
  assert.deepEqual(planPhotoBatch(20, ['a'], 20), {
    accepted: [],
    rejected: ['a'],
    remaining: 0,
    limitReached: true
  });
});

test('does not show a limit state while a selection fits', () => {
  assert.deepEqual(planPhotoBatch(3, ['a', 'b'], 20), {
    accepted: ['a', 'b'],
    rejected: [],
    remaining: 15,
    limitReached: false
  });
});
