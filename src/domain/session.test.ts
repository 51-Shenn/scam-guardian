import assert from 'node:assert/strict';
import test from 'node:test';
import { COOL_DOWN_MS, derive, initialSession, money, reduce, type Action, type Session } from './session.ts';

const run = (session: Session, ...actions: Action[]) => actions.reduce(reduce, session);
const consented = (scenario: Session['scenario']) => run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'agree' });

test('the first transfer asks for consent, then starts from the fixture', () => {
  const asked = run(initialSession, { type: 'transfer' });
  assert.equal(asked.sheet, 'consent');
  assert.equal(asked.step, 'home');
  const started = run(asked, { type: 'agree' });
  assert.deepEqual([started.step, started.consent, started.sheet, started.to, started.amount], ['recipient', true, null, 'aina', '50']);
  assert.equal(run(started, { type: 'cancel' }, { type: 'transfer' }).step, 'recipient', 'consent is asked once');
});

test('a normal transfer completes without a pause', () => {
  const review = run(consented('normal'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', null, null]);
  const done = run(review, { type: 'confirm', now: 1001 });
  assert.deepEqual([done.step, done.balance], ['success', 2450]);
});

test('a coached transfer pauses for the full cool-down and cannot be confirmed early', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', 1000 + COOL_DOWN_MS, 'pause']);
  assert.equal(derive(review, 1000).remaining, 30);
  assert.equal(derive(review, 1000).locked, true);
  assert.equal(run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS - 1 }), review);
  const done = run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS });
  assert.deepEqual([done.step, done.balance, done.deadline], ['success', 1300, null]);
});

test('the pause deadline survives back navigation and a recipient change', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  const again = run(review, { type: 'back' }, { type: 'back' }, { type: 'pick', to: 'aina' }, { type: 'next' }, { type: 'review', now: 9000 });
  assert.equal(again.deadline, 1000 + COOL_DOWN_MS);
  assert.equal(derive(again, 9000).paused, true);
});

test('without consent nothing is monitored and nothing pauses', () => {
  const started = run(initialSession, { type: 'scenario', scenario: 'coached' }, { type: 'transfer' }, { type: 'decline' });
  assert.equal(derive(started, 0).monitoring, false);
  const review = run(started, { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([review.deadline, derive(review, 1000).paused], [null, false]);
});

test('struggling switches to simple mode; a help tap does so in any scenario', () => {
  assert.equal(derive(consented('struggling'), 0).simple, true);
  assert.equal(derive(consented('struggling'), 0).decision.classification, 'Struggling');
  assert.equal(derive(consented('normal'), 0).simple, false);
  assert.equal(derive(run(consented('normal'), { type: 'help' }), 0).simple, true);
  assert.equal(derive(initialSession, 0).simple, false, 'never on the home screen');
});

test('the family alert preview needs separate consent and a hold', () => {
  const withFamily = (scenario: Session['scenario']) => run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'toggleFamily' }, { type: 'agree' }, { type: 'next' }, { type: 'review', now: 0 });
  assert.equal(derive(withFamily('coached'), 0).alert, true);
  assert.equal(derive(withFamily('medium'), 0).alert, false);
  assert.equal(derive(run(consented('coached'), { type: 'next' }, { type: 'review', now: 0 }), 0).alert, false);
  assert.equal(run(initialSession, { type: 'toggleFamily' }, { type: 'decline' }).family, false, 'declining clears it');
});

test('keypad entry keeps a valid amount shape', () => {
  const amount = run(consented('normal'), { type: 'next' }, { type: 'key', key: 'del' }, { type: 'key', key: 'del' });
  assert.equal(amount.amount, '');
  const typed = run(amount, { type: 'key', key: '0' }, { type: 'key', key: '7' }, { type: 'key', key: '.' }, { type: 'key', key: '.' }, { type: 'key', key: '2' }, { type: 'key', key: '5' }, { type: 'key', key: '9' });
  assert.equal(typed.amount, '7.25');
  assert.equal(run(amount, { type: 'key', key: '.' }).amount, '0.');
  assert.equal(run(typed, { type: 'setAmount', amount: '100' }).amount, '100');
});

test('an invalid amount stays on the amount step with a message', () => {
  const over = run(consented('normal'), { type: 'next' }, { type: 'setAmount', amount: '9999' }, { type: 'review', now: 0 });
  assert.deepEqual([over.step, over.error], ['amount', 'This amount exceeds the demo balance.']);
  assert.equal(run(over, { type: 'key', key: 'del' }).error, null);
});

test('back steps are counted and leaving the recipient step ends the session', () => {
  const amount = run(consented('normal'), { type: 'next' });
  assert.deepEqual([run(amount, { type: 'back' }).step, run(amount, { type: 'back' }).back], ['recipient', 1]);
  assert.equal(run(amount, { type: 'back' }, { type: 'back' }).step, 'home');
});

test('changing scenario cancels the transfer and clears the pause', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 0 });
  const changed = run(review, { type: 'scenario', scenario: 'normal' });
  assert.deepEqual([changed.step, changed.deadline, changed.sheet, changed.scenario], ['home', null, null, 'normal']);
});

test('remaining time and ring fraction are clamped', () => {
  const review = run(consented('coached'), { type: 'next' }, { type: 'review', now: 1000 });
  assert.deepEqual([derive(review, 0).remaining, derive(review, 0).fraction], [30, 1]);
  assert.deepEqual([derive(review, 16000).remaining, derive(review, 16000).fraction], [15, 0.5]);
  assert.deepEqual([derive(review, 99000).remaining, derive(review, 99000).fraction, derive(review, 99000).locked], [0, 0, false]);
});

test('money formats ringgit with separators and two decimals', () => {
  assert.equal(money(2500), 'RM 2,500.00');
  assert.equal(money('50.2'), 'RM 50.20');
  assert.equal(money(''), 'RM 0.00');
});
