import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { requestFeatures as referenceRequestFeatures, sessionsFor } from '../../reference/ai/prepare_contextual_model.mjs';
import { assembleBundle, type Selection } from './bundle.ts';
import { infer } from './contextual_inference.mjs';
import type { FeatureSnapshot, SessionMetadata } from './contract.ts';
import { snapshotAt } from './features.ts';
import { createLocalDemoApi } from './local-api.ts';
import { toContractEvents, type ReferenceSessionLike } from './reference-events.ts';
import { requestFeatures } from './request.ts';

const file = (p: string) => fs.readFileSync(new URL(p, import.meta.url));
const json = (p: string) => JSON.parse(file(p).toString('utf8'));
const sha = (p: string) => crypto.createHash('sha256').update(file(p)).digest('hex');
const selection: Selection = json('./model/selection.json');
const loaded = assembleBundle(
  selection,
  { lr_combined_binary: json('./model/lr_combined_binary.json'), xgb_behavior_binary: json('./model/xgb_behavior_binary.json') },
  { xgb_behavior_binary: json('./model/xgb_behavior_binary.xgb.json') },
);
const policy = json('../../reference/ai/contextual_policy_v2.json');
const examples: { input: any; expected: any }[] = json('../../reference/ai/examples.json').examples;
const sessions: ReferenceSessionLike[] = file('../../reference/ai/example_sessions.jsonl').toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
const sessionFor = (id: string) => sessions.find((s) => s.metadata.sessionId === id)!;
/** The contract fields of an example's input; reference rows also carry audit and unused features. */
const inputOf = (x: any): FeatureSnapshot => ({ feature_cutoff_ms: x.feature_cutoff_ms, stage: x.stage, features: Object.fromEntries(Object.keys(snapshotAt([], 0, { editing: true, explicitPaste: true }).features).map((k) => [k, x.features[k]])) as FeatureSnapshot['features'], delta_features: x.delta_features, context_features: x.context_features });
// Python's float64 sigmoid versus the runtime's float32 XGBoost path differ only in the last bits.
const SCORE_TOLERANCE = 1e-6;

test('the bundled model files are the frozen selection, byte for byte', () => {
  assert.equal(sha('./model/lr_combined_binary.json'), selection.model_sha256.lr_combined_binary);
  assert.equal(sha('./model/xgb_behavior_binary.json'), selection.model_sha256.xgb_behavior_binary);
  // The native XGBoost file is checked against the AI team's manifest, which was not handed over; pinned here instead.
  assert.equal(sha('./model/xgb_behavior_binary.xgb.json'), '1aa478f73b17f3709f864f6827742b3be6b332716039dc3efb0b13a5cc3b88cd');
  assert.deepEqual([selection.no_request, selection.request], ['xgb_behavior_binary', 'lr_combined_binary']);
  assert.deepEqual(json('./model/xgb_behavior_binary.json').classes, ['Normal_or_Struggling', 'Coached'], 'struggling is a negative class');
});

test('every worked example gives the expected model, score and decision', () => {
  assert.equal(examples.length, 8);
  for (const x of examples) {
    const r = infer(inputOf(x.input), loaded.bundle);
    assert.equal(r.modelId, x.expected.model, x.input.session_id);
    assert.equal(r.threshold, x.expected.threshold);
    assert.ok(Math.abs(r.reviewScore - x.expected.raw_score) < SCORE_TOLERANCE, `${x.input.session_id} score`);
    assert.equal(Number(r.reviewRecommended), x.expected.score, `${x.input.session_id} decision`);
    assert.deepEqual([r.simulationTrained, r.personalizationUsed, r.safetyEstablished], [true, false, false]);
  }
});

test('the app pipeline rebuilds each example input from its raw session events', () => {
  for (const x of examples) {
    const events = toContractEvents(sessionFor(x.input.session_id));
    assert.deepEqual(snapshotAt(events, x.expected.at, { editing: true, explicitPaste: true }), inputOf(x.input), x.input.session_id);
  }
});

test('the local API predicts each example end to end with the frozen bundle', async () => {
  for (const x of examples) {
    const s = sessionFor(x.input.session_id);
    const id = s.metadata.sessionId;
    let clock = 0;
    const api = createLocalDemoApi({ clock: () => clock, loadBundle: async () => loaded, availability: { editing: true, explicitPaste: true } });
    const meta: SessionMetadata = {
      schema_version: 'tg-expo-demo-events-v1', contract_version: 'tg-expo-demo-handoff-v1', feature_definition_version: 'tg-features-v1',
      collector_version: 'reference-replay', session_id: id, local_user_key: 'replay-user', platform: 'web', app_build: 'test',
      payment_environment: 'mock_wallet', clock: 'session-relative-monotonic-ms',
    };
    assert.ok(api.startSession(meta).ok);
    clock = x.expected.at;
    const due = toContractEvents(s).filter((e) => e.event_t_ms <= x.expected.at && e.type !== 'confirm');
    assert.ok(api.recordEvents({ session_id: id, events: due }).ok);
    const reply = await api.predict({ session_id: id, prediction_id: 'p1', feature_cutoff_ms: x.expected.at });
    assert.equal(reply.status, 'ok', id);
    if (reply.status !== 'ok') continue;
    assert.equal(reply.model_hash, selection.model_sha256[x.expected.model]);
    assert.ok(Math.abs(reply.result.reviewScore - x.expected.raw_score) < SCORE_TOLERANCE, `${id} score`);
    assert.equal(api.review(id)?.reviewLatched, x.expected.score === 1);
  }
});

test('the ported request encoder matches the reference on every authored request', () => {
  assert.deepEqual(requestFeatures(null), referenceRequestFeatures(null));
  let checked = 0;
  for (const split of ['train', 'validation', 'test']) {
    for (const r of sessionsFor(policy, 0, split).flatMap((s) => s.paymentRequests ?? [])) {
      assert.deepEqual(requestFeatures(r.input), referenceRequestFeatures(r.input), r.input?.text ?? 'missing request');
      checked++;
    }
  }
  assert.ok(checked >= 60, `checked ${checked} requests`);
});
