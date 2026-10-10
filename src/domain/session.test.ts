import assert from 'node:assert/strict';
import test from 'node:test';
import { ACCOUNT_MAX_DIGITS, AI_OFF, AI_REVIEW_REASON, AI_WAITING, COOL_DOWN_MS, derive, groupDigits, initialSession, money, reduce, type Action, type AiView, type Session } from './session.ts';

const run = (session: Session, ...actions: Action[]) => actions.reduce(reduce, session);
const consented = (scenario: Session['scenario']) => run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'agree' });
const ACCOUNT = '123412341234';
const typed: Action = { type: 'account', value: ACCOUNT, pasted: false };
const pasted: Action = { type: 'account', value: ACCOUNT, pasted: true };
/** Recipient step to review: the account (for a new recipient) and the amount are entered as a person would. */
const toReview = (session: Session, amount: string, now: number, account?: Action) =>
  run(session, ...(account ? [account] : []), { type: 'next' }, { type: 'setAmount', amount }, { type: 'review', now });
const coachedReview = (now: number) => toReview(consented('coached'), '1200', now, pasted);
const REVIEW: AiView = { status: 'review', score: 0.91, threshold: 0.72, model: 'xgb_behavior_binary', cutoff: 10000, latched: true };

test('the first transfer asks for consent, then starts with the preset recipient and an empty amount', () => {
  const asked = run(initialSession, { type: 'transfer' });
  assert.equal(asked.sheet, 'consent');
  assert.equal(asked.step, 'home');
  const started = run(asked, { type: 'agree' });
  assert.deepEqual([started.step, started.consent, started.sheet, started.to, started.amount, started.ai], ['recipient', true, null, 'aina', '', AI_WAITING]);
  assert.equal(run(started, { type: 'cancel' }, { type: 'transfer' }).step, 'recipient', 'consent is asked once');
});

test('a normal transfer completes without a pause', () => {
  const review = toReview(consented('normal'), '50', 1000);
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', null, null]);
  const done = run(review, { type: 'confirm', now: 1001 });
  assert.deepEqual([done.step, done.balance], ['success', 2450]);
});

test('a coached transfer pauses for the full cool-down and cannot be confirmed early', () => {
  const review = coachedReview(1000);
  assert.deepEqual([review.step, review.deadline, review.sheet], ['review', 1000 + COOL_DOWN_MS, 'pause']);
  assert.equal(derive(review, 1000).remaining, 15);
  assert.equal(derive(review, 1000).locked, true);
  assert.equal(derive(review, 1000).origin, 'rule');
  assert.equal(run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS - 1 }), review);
  const done = run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS });
  assert.deepEqual([done.step, done.balance, done.deadline], ['success', 1300, null]);
});

test('the pause deadline survives back navigation and a recipient change', () => {
  const review = coachedReview(1000);
  const again = run(review, { type: 'back' }, { type: 'back' }, { type: 'pick', to: 'aina' }, { type: 'next' }, { type: 'review', now: 9000 });
  assert.equal(again.deadline, 1000 + COOL_DOWN_MS);
  assert.equal(derive(again, 9000).paused, true);
});

test('without consent nothing is monitored and nothing pauses', () => {
  const started = run(initialSession, { type: 'scenario', scenario: 'coached' }, { type: 'transfer' }, { type: 'decline' });
  assert.equal(derive(started, 0).monitoring, false);
  assert.equal(started.ai, AI_OFF);
  const review = toReview(started, '1200', 1000, pasted);
  assert.deepEqual([review.deadline, derive(review, 1000).paused], [null, false]);
});

test('struggling switches to simple mode; a help tap does so in any scenario', () => {
  assert.equal(derive(consented('struggling'), 0).simple, true);
  assert.equal(derive(consented('struggling'), 0).decision.classification, 'Struggling');
  assert.equal(derive(consented('normal'), 0).simple, false);
  assert.equal(derive(run(consented('normal'), { type: 'help' }), 0).simple, true);
  assert.equal(derive(initialSession, 0).simple, false, 'never on the home screen');
});

test('asking for help brings guidance without enlarging the controls', () => {
  assert.equal(derive(consented('struggling'), 0).large, true, 'repeated back steps enlarge');
  const once = derive(run(consented('normal'), { type: 'help' }), 0);
  assert.deepEqual([once.simple, once.large], [true, false]);
  const twice = derive(run(consented('normal'), { type: 'help' }, { type: 'help' }), 0);
  assert.deepEqual([twice.decision.classification, twice.simple, twice.large], ['Struggling', true, false]);
  assert.equal(derive(run(consented('struggling'), { type: 'help' }), 0).large, true, 'help does not shrink them either');
  assert.equal(derive(consented('coached'), 0).large, false);
});

test('the family alert preview needs separate consent and a hold', () => {
  const withFamily = (scenario: Session['scenario'], amount: string, account: Action) =>
    toReview(run(initialSession, { type: 'scenario', scenario }, { type: 'transfer' }, { type: 'toggleFamily' }, { type: 'agree' }), amount, 0, account);
  assert.equal(derive(withFamily('coached', '1200', pasted), 0).alert, true);
  assert.equal(derive(withFamily('medium', '100', typed), 0).alert, false);
  assert.equal(derive(coachedReview(0), 0).alert, false);
  assert.equal(run(initialSession, { type: 'toggleFamily' }, { type: 'decline' }).family, false, 'declining clears it');
});

test('keypad entry keeps a valid amount shape', () => {
  const amount = run(consented('normal'), { type: 'next' }, { type: 'key', key: 'del' }, { type: 'key', key: 'del' });
  assert.equal(amount.amount, '');
  const keyed = run(amount, { type: 'key', key: '0' }, { type: 'key', key: '7' }, { type: 'key', key: '.' }, { type: 'key', key: '.' }, { type: 'key', key: '2' }, { type: 'key', key: '5' }, { type: 'key', key: '9' });
  assert.equal(keyed.amount, '7.25');
  assert.equal(run(amount, { type: 'key', key: '.' }).amount, '0.');
  assert.equal(run(keyed, { type: 'setAmount', amount: '100' }).amount, '100');
});

test('an invalid or missing amount stays on the amount step with a message', () => {
  const over = run(consented('normal'), { type: 'next' }, { type: 'setAmount', amount: '9999' }, { type: 'review', now: 0 });
  assert.deepEqual([over.step, over.error], ['amount', 'This amount exceeds the demo balance.']);
  assert.equal(run(over, { type: 'key', key: 'del' }).error, null);
  assert.equal(run(consented('normal'), { type: 'next' }, { type: 'review', now: 0 }).step, 'amount');
});

test('back steps are counted and leaving the recipient step ends the session', () => {
  const amount = run(consented('normal'), { type: 'next' });
  assert.deepEqual([run(amount, { type: 'back' }).step, run(amount, { type: 'back' }).back], ['recipient', 1]);
  assert.equal(run(amount, { type: 'back' }, { type: 'back' }).step, 'home');
});

test('changing scenario cancels the transfer and clears the pause', () => {
  const changed = run(coachedReview(0), { type: 'scenario', scenario: 'normal' });
  assert.deepEqual([changed.step, changed.deadline, changed.sheet, changed.scenario], ['home', null, null, 'normal']);
});

test('remaining time and ring fraction are clamped', () => {
  const review = coachedReview(1000);
  assert.deepEqual([derive(review, 0).remaining, derive(review, 0).fraction], [15, 1]);
  assert.deepEqual([derive(review, 8500).remaining, derive(review, 8500).fraction], [8, 0.5]);
  assert.deepEqual([derive(review, 99000).remaining, derive(review, 99000).fraction, derive(review, 99000).locked], [0, 0, false]);
});

test('money formats ringgit with separators and two decimals', () => {
  assert.equal(money(2500), 'RM 2,500.00');
  assert.equal(money('50.2'), 'RM 50.20');
  assert.equal(money(''), 'RM 0.00');
});

test('a new recipient needs a full account number, and only a paste raises the paste flag', () => {
  const picked = run(consented('normal'), { type: 'pick', to: 'fresh' });
  assert.equal(derive(picked, 0).ready, false);
  assert.equal(run(picked, { type: 'next' }).step, 'recipient');
  assert.equal(derive(run(picked, { type: 'account', value: '123456789', pasted: false }), 0).ready, false, 'nine digits is too short');
  const keyed = run(picked, typed);
  assert.deepEqual([keyed.account, keyed.entry, derive(keyed, 0).ready, derive(keyed, 0).signals.pasted], [ACCOUNT, 'typed', true, false]);
  const fromPaste = run(picked, pasted);
  assert.equal(derive(fromPaste, 0).signals.pasted, true);
  assert.equal(run(fromPaste, { type: 'account', value: `${ACCOUNT}5`, pasted: false }).entry, 'pasted', 'typing after a paste keeps the flag');
  assert.equal(run(fromPaste, { type: 'account', value: '', pasted: false }).entry, null, 'clearing the field resets it');
  assert.equal(run(picked, { type: 'account', value: '1234-1234 1234', pasted: false }).account, ACCOUNT, 'separators are dropped');
  assert.equal(run(picked, { type: 'account', value: '9'.repeat(20), pasted: true }).account.length, ACCOUNT_MAX_DIGITS);
  assert.equal(run(keyed, { type: 'next' }).step, 'amount');
  assert.deepEqual([run(keyed, { type: 'pick', to: 'aina' }).entry, run(keyed, { type: 'pick', to: 'aina' }).account], [null, ''], 'a saved contact clears it');
  assert.equal(run(consented('normal'), typed).account, '', 'a saved contact has no account field');
});

test('the simulated call follows the preset and can be switched by hand', () => {
  assert.equal(consented('coached').call, true);
  assert.equal(consented('normal').call, false);
  const byHand = run(consented('normal'), { type: 'toggleCall', now: 0 }, { type: 'pick', to: 'fresh' }, pasted);
  assert.equal(derive(byHand, 0).decision.response, 'hold');
  assert.equal(derive(run(byHand, { type: 'toggleCall', now: 0 }), 0).decision.response, 'continue');
});

test('a call that starts during review begins the cool-down instead of locking the transfer', () => {
  const review = toReview(run(consented('normal'), { type: 'pick', to: 'fresh' }), '50', 1000, typed);
  assert.equal(review.deadline, null);
  const called = run(review, { type: 'toggleCall', now: 2000 });
  assert.deepEqual([called.deadline, called.sheet], [2000 + COOL_DOWN_MS, 'pause']);
  assert.equal(run(called, { type: 'toggleCall', now: 3000 }).deadline, 2000 + COOL_DOWN_MS, 'ending the call does not end the pause');
});

test('an AI review adds the same cool-down, with the contract wording and no family alert', () => {
  const amount = run(consented('normal'), { type: 'toggleFamily' }, { type: 'next' }, { type: 'setAmount', amount: '50' });
  const flagged = run(amount, { type: 'ai', ai: REVIEW, now: 500 });
  assert.equal(flagged.deadline, null, 'the pause waits for the review step');
  const review = run(flagged, { type: 'review', now: 1000 });
  const view = derive(review, 1000);
  assert.deepEqual([review.deadline, review.sheet, view.origin, view.decision.response], [1000 + COOL_DOWN_MS, 'pause', 'ai', 'cooldown']);
  assert.deepEqual(view.decision.reasons, [AI_REVIEW_REASON]);
  assert.equal(view.alert, false);
  assert.equal(run(review, { type: 'confirm', now: 1000 + COOL_DOWN_MS }).step, 'success', 'the person still decides');
});

test('an AI review during review starts the cool-down; with a rule hold it is combined', () => {
  const review = toReview(consented('normal'), '50', 1000);
  assert.deepEqual([run(review, { type: 'ai', ai: REVIEW, now: 2000 }).deadline, run(review, { type: 'ai', ai: REVIEW, now: 2000 }).sheet], [2000 + COOL_DOWN_MS, 'pause']);
  const both = run(coachedReview(1000), { type: 'ai', ai: REVIEW, now: 2000 });
  assert.deepEqual([derive(both, 2000).origin, derive(both, 2000).decision.response, both.deadline], ['combined', 'hold', 1000 + COOL_DOWN_MS]);
});

test('a late AI answer after the transfer ended is dropped, and a clear answer never pauses', () => {
  const ended = run(consented('normal'), { type: 'cancel' });
  assert.equal(run(ended, { type: 'ai', ai: REVIEW, now: 0 }), ended);
  const clear = run(toReview(consented('normal'), '50', 1000), { type: 'ai', ai: { ...REVIEW, status: 'clear', score: 0.1, latched: false }, now: 2000 });
  assert.equal(clear.deadline, null);
  const unmonitored = run(initialSession, { type: 'transfer' }, { type: 'decline' }, { type: 'ai', ai: REVIEW, now: 0 });
  assert.equal(derive(unmonitored, 0).paused, false, 'without consent an AI answer cannot pause');
});

test('the simulated app switch toggles without blocking or pausing the transfer', () => {
  const amount = run(consented('normal'), { type: 'toggleAway', now: 1000 }, { type: 'next' });
  assert.deepEqual([amount.away, amount.step], [true, 'amount']);
  assert.equal(derive(amount, 0).paused, false, 'it is collected, not used by the rules');
  assert.equal(run(amount, { type: 'toggleAway', now: 2000 }).away, false);
  assert.equal(run(amount, { type: 'scenario', scenario: 'coached' }).away, false, 'a new preset clears it');
});

test('away time adds up across switches and resets with each transfer', () => {
  const twice = run(consented('normal'), { type: 'toggleAway', now: 1000 }, { type: 'toggleAway', now: 4000 }, { type: 'toggleAway', now: 6000 });
  assert.equal(derive(twice, 6500).awayMs, 3500, 'three seconds done, half a second in progress');
  const back = run(twice, { type: 'toggleAway', now: 8000 });
  assert.deepEqual([back.awayMs, derive(back, 99000).awayMs], [5000, 5000]);
  assert.equal(run(back, { type: 'cancel' }, { type: 'transfer' }).awayMs, 0);
});

test('account numbers read back in groups of four', () => {
  assert.equal(groupDigits('123412341234'), '1234 1234 1234');
  assert.equal(groupDigits('1234567890'), '1234 5678 90');
});

test('reset returns the demo to its first state', () => {
  assert.deepEqual(run(coachedReview(0), { type: 'reset' }), initialSession);
});
