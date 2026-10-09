import assert from 'node:assert/strict';
import test from 'node:test';
import { canConfirm, evaluate, validateAmount } from './risk.ts';

const normal = { callActive: false, newRecipient: false, pasted: false, amountRatio: 1, backPresses: 0, helpTaps: 0 };
test('normal and known-recipient family calls are uninterrupted', () => {
  assert.equal(evaluate(normal).response, 'continue');
  assert.equal(evaluate({ ...normal, callActive: true }).response, 'continue');
});
test('help and navigation trigger guidance, not a coached accusation', () => {
  assert.equal(evaluate({ ...normal, backPresses: 3 }).classification, 'Struggling');
  assert.equal(evaluate({ ...normal, helpTaps: 2 }).response, 'guide');
});
test('hard rule holds for either paste metadata or excessive amount', () => {
  const risky = { ...normal, callActive: true, newRecipient: true };
  assert.equal(evaluate({ ...risky, pasted: true }).response, 'hold');
  assert.equal(evaluate({ ...risky, amountRatio: 3.1 }).response, 'hold');
  assert.equal(evaluate({ ...risky, amountRatio: 3 }).response, 'cooldown');
});
test('coercion signals outrank help requests', () => {
  assert.equal(evaluate({ ...normal, callActive: true, newRecipient: true, pasted: true, helpTaps: 5 }).response, 'hold');
});
test('amount validation rejects invalid, negative, excessive and fractional-cent amounts', () => {
  for (const text of ['', '-1', '0', 'Infinity', '1e3', '1.001', '2501']) assert.ok(validateAmount(text, 2500));
  assert.equal(validateAmount('50.20', 2500), null);
});
test('confirmation checks the absolute deadline, including exact boundary', () => {
  assert.equal(canConfirm(30000, 29999), false);
  assert.equal(canConfirm(30000, 30000), true);
  assert.equal(canConfirm(null, 0), true);
});
