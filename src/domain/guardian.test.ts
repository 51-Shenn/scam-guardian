import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { assembleBundle } from './bundle.ts';
import { createGuardian } from './guardian.ts';
import { createLocalDemoApi, type LoadedBundle } from './local-api.ts';
import { derive, initialSession, reduce, type Action, type AiView, type Session } from './session.ts';

const json = (p: string) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const MODEL = assembleBundle(json('./model/selection.json'),
  { lr_combined_binary: json('./model/lr_combined_binary.json'), xgb_behavior_binary: json('./model/xgb_behavior_binary.json') },
  { xgb_behavior_binary: json('./model/xgb_behavior_binary.xgb.json') });

/** Drives the bank app the way the UI provider does: reduce, observe, and predict on the grid. */
function harness(bundle: LoadedBundle | null = MODEL) {
  let clock = 0;
  let ids = 0;
  const api = createLocalDemoApi({ clock: () => clock, loadBundle: async () => bundle, availability: { editing: true, explicitPaste: true } });
  const guardian = createGuardian({ api, platform: 'web', appBuild: 'test', localUserKey: 'test-user', newId: () => `s${++ids}` });
  let session: Session = initialSession;
  const views: AiView[] = [];
  return {
    api, guardian,
    get session() { return session; },
    views,
    /** Advances the clock, runs any due predictions, then applies the action. */
    async at(ms: number, ...actions: Action[]) {
      clock = ms;
      const view = await guardian.predictDue();
      if (view) { views.push(view); session = reduce(session, { type: 'ai', ai: view, now: ms }); }
      for (const action of actions) {
        const next = reduce(session, action);
        guardian.observe(action, session, next);
        session = next;
      }
    },
    snapshot(cutoff: number) {
      const id = guardian.sessionId!;
      const result = api.buildSnapshot({ session_id: id, prediction_id: `look-${cutoff}`, feature_cutoff_ms: cutoff });
      assert.ok(result.ok, JSON.stringify(result));
      return result.value.input;
    },
  };
}

const keys = (digits: string): Action[] => [...digits].map((key) => ({ type: 'key', key }));

test('nothing is collected without consent', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'decline' });
  assert.equal(h.guardian.sessionId, null);
  await h.at(6000, { type: 'next' });
  assert.equal(h.views.length, 0);
});

test('a saved-contact transfer becomes contract events with no content', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' });
  const id = h.guardian.sessionId;
  assert.ok(id);
  await h.at(1500, { type: 'next' });
  await h.at(2400, ...keys('5'));
  await h.at(3100, ...keys('0'));
  await h.at(4000, { type: 'help' });
  await h.at(4800, { type: 'review', now: 4800 });
  const input = h.snapshot(0);
  assert.equal(input.stage, 'recipient');
  await h.at(5200);
  const later = h.snapshot(5000);
  assert.equal(later.stage, 'review');
  assert.deepEqual([later.features.amount_edit_count, later.features.amount_interval_sample_count, later.features.recipient_edit_count, later.features.help_count, later.features.user_focus_count],
    [2, 1, 0, 1, 1], 'two keypad edits, one help tap, the keypad as the amount field');
  assert.equal(later.features.explicit_paste_count, 0);
  assert.equal(later.context_features.request_present, 0);
  await h.at(6000, { type: 'confirm', now: 6000 });
  assert.equal(h.guardian.sessionId, null, 'confirmation ends the session');
});

test('typing and pasting an account number are recorded as length changes only', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' }, { type: 'pick', to: 'fresh' });
  h.guardian.focus('recipient', true);
  for (let i = 1; i <= 6; i++) await h.at(500 * i, { type: 'account', value: '1'.repeat(i), pasted: false });
  await h.at(3500, { type: 'account', value: '111111234412', pasted: true });
  h.guardian.blur('recipient');
  await h.at(5000);
  const f = h.snapshot(5000).features;
  assert.deepEqual([f.recipient_edit_count, f.explicit_paste_count, f.user_focus_count, f.recipient_interval_sample_count], [7, 1, 1, 6]);
  assert.ok(!JSON.stringify(h.snapshot(5000)).includes('111111234412'), 'the account number never enters the snapshot');
});

test('the simulated call is a separate signal and never a payment event', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' });
  await h.at(1000, { type: 'toggleCall', now: 1000 });
  const id = h.guardian.sessionId!;
  await h.at(5000);
  const envelope = h.api.buildSnapshot({ session_id: id, prediction_id: 'x', feature_cutoff_ms: 5000 });
  assert.ok(envelope.ok);
  assert.equal(envelope.value.simulation_context.call, 'active');
  assert.equal(envelope.value.input.features.foreground_pause_count, 1, 'the call button is not a payment interaction');
});

test('a call already on when the transfer starts is recorded from the start', async () => {
  const h = harness();
  await h.at(0, { type: 'scenario', scenario: 'coached' }, { type: 'transfer' }, { type: 'agree' });
  await h.at(5000);
  const envelope = h.api.buildSnapshot({ session_id: h.guardian.sessionId!, prediction_id: 'x', feature_cutoff_ms: 0 });
  assert.ok(envelope.ok);
  assert.equal(envelope.value.simulation_context.call, 'active');
});

test('a simulated app switch is its own signal, never an observed app state or background time', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' });
  await h.at(1000, { type: 'toggleAway' });
  await h.at(3000, { type: 'next' });
  await h.at(4000, { type: 'toggleAway' });
  await h.at(5000);
  const id = h.guardian.sessionId!;
  const during = h.api.buildSnapshot({ session_id: id, prediction_id: 'a', feature_cutoff_ms: 0 });
  const after = h.api.buildSnapshot({ session_id: id, prediction_id: 'b', feature_cutoff_ms: 5000 });
  assert.ok(during.ok && after.ok);
  assert.equal(after.value.simulation_context.external_switch, 'returned');
  assert.equal(during.value.simulation_context.external_switch, 'unknown', 'unknown until the button is used');
  assert.equal(after.value.input.features.background_or_blur_ms, 0, 'simulated away time is not background time');
  assert.equal(after.value.input.stage, 'amount', 'the bank app stays usable while away');
});

test('a switch already on when the transfer starts is recorded as away', async () => {
  const h = harness();
  await h.at(0, { type: 'toggleAway' }, { type: 'transfer' }, { type: 'agree' });
  await h.at(5000);
  const envelope = h.api.buildSnapshot({ session_id: h.guardian.sessionId!, prediction_id: 'x', feature_cutoff_ms: 0 });
  assert.ok(envelope.ok);
  assert.equal(envelope.value.simulation_context.external_switch, 'away');
});

test('focus after returning to the app, without a touch, is a restoration', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' }, { type: 'pick', to: 'fresh' });
  h.guardian.focus('recipient', true);
  await h.at(1000, { type: 'account', value: '1', pasted: false });
  h.guardian.lifecycle('background');
  await h.at(3000);
  h.guardian.lifecycle('active');
  h.guardian.focus('recipient', false);
  h.guardian.focus('recipient', false);
  await h.at(5000);
  const f = h.snapshot(5000).features;
  assert.deepEqual([f.user_focus_count, f.restoration_focus_count], [1, 1], 'only the first focus after returning is a restoration');
  assert.equal(f.background_or_blur_ms, 2000);
});

test('the frozen model scores each grid point, and the answer reaches the session', async () => {
  const h = harness();
  await h.at(0, { type: 'transfer' }, { type: 'agree' });
  await h.at(2000, { type: 'next' });
  await h.at(3000, ...keys('5'));
  await h.at(3700, ...keys('0'));
  await h.at(11000);
  assert.deepEqual(h.views.map((v) => v.cutoff), [0, 10000], 'grid points 0, 5 and 10 s, reported after each batch');
  const last = h.views.at(-1)!;
  assert.ok(last.status === 'clear' || last.status === 'review');
  assert.equal(typeof last.score, 'number');
  assert.equal(last.threshold, 0.724197506904602, 'no request: the XGBoost behaviour head');
  assert.equal(h.session.ai, last);
});

test('without the bundle the AI is reported unavailable and nothing pauses', async () => {
  const h = harness(null);
  await h.at(0, { type: 'transfer' }, { type: 'agree' });
  await h.at(6000, { type: 'next' });
  assert.equal(h.session.ai.status, 'unavailable');
  assert.equal(derive(h.session, 6000).paused, false);
});

test('a shown warning and the person’s choice are kept in the timeline', async () => {
  const h = harness();
  await h.at(0, { type: 'scenario', scenario: 'coached' }, { type: 'transfer' }, { type: 'agree' }, { type: 'account', value: '123412341234', pasted: true }, { type: 'next' });
  await h.at(1000, ...keys('1200'), { type: 'review', now: 1000 });
  const view = derive(h.session, 1000);
  assert.deepEqual([h.session.sheet, view.origin], ['pause', 'rule']);
  h.guardian.warn('rule');
  h.guardian.warn('rule');
  h.guardian.verify('cancel');
  const id = h.guardian.sessionId!;
  // Timeline so far: the 0 s prediction, then decision, display and the cancel choice.
  const entry = { session_id: id, entry_seq: 4, event_t_ms: 1000, type: 'warning_display', payload: { intervention_id: `${id}-w1` } } as const;
  const again = h.api.recordTimeline(entry);
  assert.equal(!again.ok && again.error.code, 'OUT_OF_ORDER', 'decision, display and action were recorded once each');
});
