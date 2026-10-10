import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import type { DemoEvent, SessionMetadata, TimelineEntry } from './contract.ts';
import { NO_REQUEST } from './features.ts';
import { createLocalDemoApi, type LoadedBundle } from './local-api.ts';

// A hand-made model for tests only: more back navigation raises the score. Not the AI team's model.
const TEST_BUNDLE: LoadedBundle = {
  bundle: {
    selection: { request: 'test_lr', no_request: 'test_lr', thresholds: { test_lr: 0.5 } },
    models: { test_lr: { algorithm: 'lr', feature_names: ['raw:back_count', 'stage:review'], preprocessor: { medians: [0, 0], centers: [0, 0], scales: [1, 1] }, classifier: { coef: [[2, 0, 0, 0]], intercept: [-2] } } },
  },
  modelHashes: { test_lr: 'test-only-hash' },
};

const meta = (session_id = 's1', local_user_key = 'u1'): SessionMetadata => ({
  schema_version: 'tg-expo-demo-events-v1', contract_version: 'tg-expo-demo-handoff-v1', feature_definition_version: 'tg-features-v1',
  collector_version: 'test', session_id, local_user_key, platform: 'web', app_build: 'test', payment_environment: 'mock_wallet', clock: 'session-relative-monotonic-ms',
});

function setup(bundle: LoadedBundle | null = TEST_BUNDLE) {
  let t = 1000;
  const api = createLocalDemoApi({ clock: () => t, loadBundle: async () => bundle, availability: { editing: true, explicitPaste: true } });
  return { api, at: (ms: number) => { t = 1000 + ms; } };
}
const ev = (event_seq: number, event_t_ms: number, rest: object, session_id = 's1') => ({ session_id, event_seq, event_t_ms, ...rest }) as DemoEvent;
const start = ev(0, 0, { type: 'session_start', source: 'observed_ui', payload: { step_id: 'recipient' } });
const nav = (seq: number, t: number, step_id: string, direction: string) => ev(seq, t, { type: 'navigate', source: 'observed_ui', payload: { step_id, direction } });
const req = (feature_cutoff_ms: number, prediction_id = `p${feature_cutoff_ms}`) => ({ session_id: 's1', prediction_id, feature_cutoff_ms });

test('the AI team files are kept byte for byte', () => {
  const sha = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(new URL(p, import.meta.url))).digest('hex');
  assert.equal(sha('./contextual_inference.mjs'), '01ab8a2963bb009dc08b16d6067dcce3a3fdd39e2b200daf2e1b5c1771d0560b');
  assert.equal(sha('../../reference/ai/prepare_contract_data.mjs'), '86fa5954bdbd51c35dd5d37c38a388a152b39ba2e27344ea71c36cfab1053302');
});

test('sessions open once with the contract versions and real platform', () => {
  const { api } = setup();
  assert.equal(api.startSession(meta()).ok, true);
  assert.deepEqual(api.startSession(meta()), { ok: false, error: { code: 'SESSION_MISMATCH', path: 'session_id', retryable: false, message: 'The record belongs to a different or unknown session.' } });
  const old = api.startSession({ ...meta('s2'), schema_version: 'tg-production-events-v1' } as unknown as SessionMetadata);
  assert.equal(!old.ok && old.error.code, 'UNSUPPORTED_VERSION');
  const extra = api.startSession({ ...meta('s3'), name: 'Rohani' } as unknown as SessionMetadata);
  assert.equal(!extra.ok && extra.error.code, 'INVALID_PAYLOAD', 'closed objects reject extra fields');
});

test('event batches are contiguous, ordered, atomic and idempotent', () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(3000);
  assert.deepEqual(api.recordEvents({ session_id: 's1', events: [start, nav(1, 1000, 'amount', 'forward')] }), { ok: true, value: { accepted_count: 2, last_event_seq: 1 } });
  assert.deepEqual(api.recordEvents({ session_id: 's1', events: [start] }), { ok: true, value: { accepted_count: 0, last_event_seq: 1 } }, 'exact retry is a no-op');
  const conflict = api.recordEvents({ session_id: 's1', events: [nav(1, 1000, 'review', 'forward')] });
  assert.equal(!conflict.ok && conflict.error.code, 'CONFLICTING_RETRY');
  const gap = api.recordEvents({ session_id: 's1', events: [nav(3, 2000, 'review', 'forward')] });
  assert.equal(!gap.ok && gap.error.code, 'OUT_OF_ORDER');
  const future = api.recordEvents({ session_id: 's1', events: [nav(2, 2000, 'review', 'forward'), nav(3, 9000, 'amount', 'back')] });
  assert.equal(!future.ok && future.error.code, 'FUTURE_EVENT');
  assert.deepEqual(api.recordEvents({ session_id: 's1', events: [nav(2, 2000, 'review', 'forward')] }), { ok: true, value: { accepted_count: 1, last_event_seq: 2 } }, 'the rejected batch stored nothing');
});

test('events must follow the contract and carry no content', () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(1000);
  const typed = api.recordEvents({ session_id: 's1', events: [start, ev(1, 500, { type: 'edit', source: 'observed_ui', payload: { field_id: 'recipient', length_delta: 1, input_source: 'typing', text: '8' } })] });
  assert.deepEqual(!typed.ok && [typed.error.code, typed.error.path], ['INVALID_PAYLOAD', 'events[1].payload']);
  const fake = api.recordEvents({ session_id: 's1', events: [start, ev(1, 500, { type: 'simulated_context', source: 'observed_lifecycle', payload: { signal: 'call', state: 'active' } })] });
  assert.equal(!fake.ok && fake.error.code, 'INVALID_PAYLOAD', 'a simulated call cannot pose as an observation');
  const late = api.recordEvents({ session_id: 's1', events: [start, ev(1, 500, { type: 'transaction', source: 'mock_wallet', payload: {
    amount_minor_units: 5000, currency: 'MYR', is_new_recipient: true, available_balance_minor_units: 250000, recent_transfer_count: 1,
    recipient_history_count: 0, history_window_ms: 2592000000, context_as_of_ms: 900 } })] });
  assert.equal(!late.ok && late.error.code, 'INVALID_PAYLOAD', 'context cannot be newer than its event');
  const cues = api.recordEvents({ session_id: 's1', events: [start, ev(1, 500, { type: 'request_context', source: 'authored_demo_request', payload: { ...NO_REQUEST, urgency: 1 } })] });
  assert.equal(!cues.ok && cues.error.code, 'INVALID_PAYLOAD', 'cues must stay null without a request');
});

test('nothing is accepted after confirmation or session end', () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(2000);
  api.recordEvents({ session_id: 's1', events: [start, ev(1, 1000, { type: 'confirm', source: 'observed_ui', payload: {} })] });
  const after = api.recordEvents({ session_id: 's1', events: [nav(2, 1500, 'amount', 'back')] });
  assert.equal(!after.ok && after.error.code, 'SESSION_CLOSED');
  const snap = api.buildSnapshot(req(5000));
  assert.equal(!snap.ok && snap.error.code, 'FUTURE_EVENT');
  at(6000);
  const closed = api.buildSnapshot(req(5000));
  assert.equal(!closed.ok && closed.error.code, 'SESSION_CLOSED', 'cutoffs must precede confirmation');
  assert.equal(api.endSession('s1', 'confirmed', 1000).ok, true);
  assert.equal(api.endSession('s1', 'confirmed', 1000).ok, false, 'the outcome is recorded once');
});

test('snapshots use the five-second grid and never future events', () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(12000);
  api.recordEvents({ session_id: 's1', events: [start, nav(1, 2000, 'amount', 'forward'), nav(2, 8000, 'recipient', 'back')] });
  const off = api.buildSnapshot(req(7000));
  assert.equal(!off.ok && off.error.code, 'INVALID_PAYLOAD');
  const snap = api.buildSnapshot(req(5000));
  assert.ok(snap.ok);
  assert.equal(snap.value.input.features.back_count, 0, 'the back step at 8 s is after the cutoff');
  assert.equal(snap.value.input.stage, 'amount');
  assert.equal(snap.value.baseline, null);
  assert.deepEqual(snap.value.simulation_context, { source: 'simulation_button', call: 'unknown', external_switch: 'unknown', motion: 'unknown' });
});

test('without the model bundle the reply is ai_unavailable, never a safe result', async () => {
  const { api, at } = setup(null);
  api.startSession(meta());
  at(1000);
  api.recordEvents({ session_id: 's1', events: [start] });
  const reply = await api.predict(req(0));
  assert.equal(reply.status, 'ai_unavailable');
  assert.equal(reply.status === 'ai_unavailable' && reply.error.code, 'MODEL_UNAVAILABLE');
  assert.equal(reply.status === 'ai_unavailable' && reply.error.retryable, true);
  assert.equal(api.review('s1'), null);
});

test('predictions are cached, latched and tied to the exact model', async () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(11000);
  api.recordEvents({ session_id: 's1', events: [start, nav(1, 1000, 'amount', 'forward'), nav(2, 6000, 'recipient', 'back'), nav(3, 7000, 'amount', 'forward'), nav(4, 8000, 'recipient', 'back')] });
  const first = await api.predict(req(5000));
  assert.ok(first.status === 'ok');
  assert.deepEqual([first.result.reviewRecommended, first.model_hash, first.result.safetyEstablished], [false, 'test-only-hash', false]);
  const second = await api.predict(req(10000));
  assert.ok(second.status === 'ok' && second.result.reviewRecommended);
  assert.equal(api.review('s1')?.reviewLatched, true);
  assert.equal(api.review('s1')?.firstReviewMs, 10000);
  assert.equal(await api.predict(req(10000)), second, 'retrying an id returns the cached reply');
  const clash = await api.predict(req(5000, 'p10000'));
  assert.equal(clash.status === 'ai_unavailable' && clash.error.code, 'CONFLICTING_RETRY');
  const reused = await api.predict(req(10000, 'again'));
  assert.ok(reused.status === 'ok' && reused.prediction_id === 'again' && reused.result.reviewScore === second.result.reviewScore);
  const stale = await api.predict(req(0));
  assert.equal(stale.status === 'ai_unavailable' && stale.error.code, 'OUT_OF_ORDER', 'an earlier cutoff cannot rewind the latch');
});

test('warnings need an ordered decision, display and action', async () => {
  const { api, at } = setup();
  api.startSession(meta());
  at(11000);
  api.recordEvents({ session_id: 's1', events: [start, nav(1, 1000, 'amount', 'forward'), nav(2, 6000, 'recipient', 'back'), nav(3, 7000, 'amount', 'forward'), nav(4, 8000, 'recipient', 'back')] });
  await api.predict(req(5000));
  await api.predict(req(10000));
  const entry = (entry_seq: number, event_t_ms: number, type: string, payload: object) => ({ session_id: 's1', entry_seq, event_t_ms, type, payload }) as TimelineEntry;
  const early = api.recordTimeline(entry(0, 10000, 'warning_decision', { prediction_id: 'p5000', intervention_id: 'w1', origin: 'ai' }));
  assert.equal(!early.ok && early.error.code, 'INVALID_PAYLOAD', 'a negative prediction cannot justify an AI warning');
  const notShown = api.recordTimeline(entry(0, 10000, 'verification_action', { intervention_id: 'w1', action: 'cancel' }));
  assert.equal(!notShown.ok && notShown.error.code, 'OUT_OF_ORDER');
  assert.equal(api.recordTimeline(entry(0, 10000, 'warning_decision', { prediction_id: 'p10000', intervention_id: 'w1', origin: 'ai' })).ok, true);
  assert.equal(api.recordTimeline(entry(1, 10050, 'warning_display', { intervention_id: 'w1' })).ok, true);
  assert.equal(api.recordTimeline(entry(2, 10900, 'verification_action', { intervention_id: 'w1', action: 'mock_known_contact_check' })).ok, true);
  assert.equal(api.recordTimeline(entry(3, 10950, 'warning_decision', { prediction_id: null, intervention_id: 'r1', origin: 'rule' })).ok, true, 'rule-only warnings need no prediction');
});
