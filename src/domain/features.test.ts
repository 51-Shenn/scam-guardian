import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { augmentSession, featuresAt, generateSession, type ReferenceSession } from '../../reference/ai/prepare_contract_data.mjs';
import type { DemoEvent } from './contract.ts';
import { behaviourAt, dueCutoffs, NO_REQUEST, simulatedAwayMs, simulationAt, snapshotAt, SNAPSHOT_PERIOD_MS, type Availability } from './features.ts';
import { toContractEvents } from './reference-events.ts';

const policy = JSON.parse(fs.readFileSync(new URL('../../reference/ai/contextual_policy_v2.json', import.meta.url), 'utf8'));
const KEYS = Object.keys(snapshotAt([], 0, { editing: true, explicitPaste: true }).features);
const DELTAS = ['back_count', 'user_focus_count', 'recipient_edit_count', 'amount_edit_count', 'foreground_idle_excess_ms'];

function assertParity(s: ReferenceSession, availability: Availability) {
  const events = toContractEvents(s);
  const pick = (f: Record<string, number | null>) => Object.fromEntries(KEYS.map((k) => [k, f[k]]));
  let cutoffs = 0;
  for (let t = 0; t < s.researchAnnotations.confirmedAtMs; t += SNAPSHOT_PERIOD_MS, cutoffs++) {
    const reference = pick(featuresAt(s, t, policy).features);
    const ours = snapshotAt(events, t, availability);
    assert.deepEqual(ours.features, reference, `${s.metadata.sessionId} features at ${t} ms`);
    const before = featuresAt(s, Math.max(0, t - 5000), policy).features;
    for (const k of DELTAS) {
      const expected = reference[k] === null || before[k] === null ? null : (reference[k] as number) - (before[k] as number);
      assert.equal(ours.delta_features[k as keyof typeof ours.delta_features], expected, `${s.metadata.sessionId} delta ${k} at ${t} ms`);
    }
  }
  return cutoffs;
}

test('features match the reference featuresAt at every 5 s cutoff, for every class', () => {
  let checked = 0;
  const classes = new Set<string>();
  for (let user = 0; user < 12; user++) {
    for (let ordinal = 0; ordinal < policy.enrollmentPool + policy.classes.length * policy.evaluationSessionsPerClass; ordinal++) {
      const s = generateSession(policy, user, ordinal, 'test');
      classes.add(s.researchAnnotations.scenario);
      checked += assertParity(s, { editing: true, explicitPaste: true });
    }
  }
  assert.deepEqual([...classes].sort(), [...policy.classes].sort(), 'every label family is represented');
  assert.ok(checked > 1000, `checked ${checked} cutoffs`);
});

test('an unavailable editing channel gives null edit features, matching the reference', () => {
  for (let user = 0; user < 4; user++) {
    const parent = generateSession(policy, user, policy.enrollmentPool + 6, 'train');
    assertParity(augmentSession(parent, 'edit_channel_unavailable', policy), { editing: false, explicitPaste: false });
  }
});

const ev = (event_seq: number, event_t_ms: number, rest: object) => ({ session_id: 's1', event_seq, event_t_ms, ...rest }) as DemoEvent;
const start = ev(0, 0, { type: 'session_start', source: 'observed_ui', payload: { step_id: 'recipient' } });

test('simulation buttons and request messages never change behaviour features', () => {
  const plain = [start, ev(1, 4000, { type: 'help', source: 'observed_ui', payload: { step_id: 'recipient' } })];
  const noisy = [start,
    ev(1, 1000, { type: 'simulated_context', source: 'simulation_button', payload: { signal: 'call', state: 'active' } }),
    ev(2, 2000, { type: 'simulated_context', source: 'simulation_button', payload: { signal: 'external_switch', state: 'away' } }),
    ev(3, 4000, { type: 'help', source: 'observed_ui', payload: { step_id: 'recipient' } })];
  const on = { editing: true, explicitPaste: true };
  assert.deepEqual(behaviourAt(noisy, 10000, on), behaviourAt(plain, 10000, on));
  assert.deepEqual(simulationAt(noisy, 10000), { source: 'simulation_button', call: 'active', external_switch: 'away', motion: 'unknown' });
  assert.deepEqual(simulationAt(noisy, 500), { source: 'simulation_button', call: 'unknown', external_switch: 'unknown', motion: 'unknown' });
});

test('request cues apply only from the moment the request is shown', () => {
  const cues = { ...NO_REQUEST, request_present: 1, urgency: 1, secrecy: 1, safe_account: 1 };
  const events = [start, ev(1, 6000, { type: 'request_context', source: 'authored_demo_request', payload: cues })];
  const on = { editing: true, explicitPaste: true };
  assert.deepEqual(snapshotAt(events, 5000, on).context_features, NO_REQUEST);
  assert.deepEqual(snapshotAt(events, 10000, on).context_features, cues);
});

test('missing measurements stay null instead of becoming zero', () => {
  const off = snapshotAt([start], 5000, { editing: true, explicitPaste: false });
  assert.equal(off.features.explicit_paste_count, null);
  assert.equal(off.features.recipient_edit_count, 0);
  assert.equal(off.features.recipient_edit_interval_mean_ms, null);
  assert.deepEqual(off.delta_features, { back_count: 0, user_focus_count: 0, recipient_edit_count: 0, amount_edit_count: 0, foreground_idle_excess_ms: 2000 });
});

test('due cutoffs follow the frozen five-second grid', () => {
  assert.deepEqual(dueCutoffs(null, 0), [0]);
  assert.deepEqual(dueCutoffs(null, 12000), [0, 5000, 10000]);
  assert.deepEqual(dueCutoffs(10000, 14999), []);
  assert.deepEqual(dueCutoffs(10000, 20000), [15000, 20000]);
});

test('simulated away time counts only switches with a known start', () => {
  const sw = (seq: number, t: number, state: string) => ev(seq, t, { type: 'simulated_context', source: 'simulation_button', payload: { signal: 'external_switch', state } });
  assert.equal(simulatedAwayMs([start], 10000), null, 'never pressed: unknown, not zero');
  const events = [start, sw(1, 2000, 'away'), sw(2, 5000, 'returned'), sw(3, 7000, 'away')];
  assert.equal(simulatedAwayMs(events, 4000), 2000);
  assert.equal(simulatedAwayMs(events, 6000), 3000);
  assert.equal(simulatedAwayMs(events, 9000), 5000, 'an open switch runs to the cutoff');
  assert.equal(simulatedAwayMs([start, sw(1, 3000, 'returned')], 9000), 0, 'a return with no known start adds nothing');
});
