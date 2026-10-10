import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { explainLinear } from './explanation.ts';
import { probability, rawVector } from './contextual_inference.mjs';
import { snapshotAt } from './features.ts';
import { DEMO_REQUESTS, requestFeatures } from './request.ts';
import { decisionSupport } from './decision-support.ts';
import { derive, initialSession } from './session.ts';

const read = (name: string) => JSON.parse(fs.readFileSync(new URL(`./model/${name}.json`, import.meta.url), 'utf8'));
const lr = read('lr_combined_binary');
const threshold = read('selection').thresholds.lr_combined_binary;

test('all LR feature and missingness contributions reconstruct the frozen score', () => {
  for (const cutoff of [0, 5000, 25000]) {
    for (const editing of [true, false]) {
      const row = { ...snapshotAt([], cutoff, { editing, explicitPaste: editing }), context_features: requestFeatures(DEMO_REQUESTS.coached) };
      const explanation = explainLinear('lr_combined_binary', lr, row, threshold)!;
      const expected = probability(lr, rawVector(lr, row));
      assert.ok(Math.abs(expected - explanation.reconstructedScore) < 1e-12);
      assert.equal(explanation.contributions.length, lr.feature_names.length);
      assert.ok(Math.abs(explanation.intercept + explanation.contributions.reduce((s, c) => s + c.value, 0) - explanation.margin) < 1e-12);
      assert.equal(explanation.margin >= explanation.thresholdMargin, expected >= threshold);
      assert.ok(explanation.contributions.some((c) => c.missing), 'missing-indicator terms must remain in the explanation');
    }
  }
});

test('XGB is not given a fabricated linear explanation', () => {
  assert.equal(explainLinear('xgb_behavior_binary', read('xgb_behavior_binary'), snapshotAt([], 0, { editing: true, explicitPaste: true }), 0.7), null);
});

test('display categories and priority distinguish assistance, review and unavailable assessment', () => {
  const base = { ...initialSession, consent: true, step: 'recipient' as const };
  const help = { ...base, help: 2 };
  assert.equal(decisionSupport(help, derive(help, 0)).priority, 'Offer guidance');
  const coached = { ...base, demoRequest: 'coached' as const, requestShown: true, ai: { ...base.ai, latched: true, status: 'review' as const } };
  assert.equal(decisionSupport(coached, derive(coached, 0)).category, 'Warning bypass instructions');
  assert.equal(decisionSupport(coached, derive(coached, 0)).priority, 'Check before confirmation');
  const unavailable = { ...base, ai: { ...base.ai, status: 'unavailable' as const } };
  assert.equal(decisionSupport(unavailable, derive(unavailable, 0)).priority, 'Assessment unavailable');
  assert.match(decisionSupport(base, derive(base, 0)).action, /does not establish safety/);
});
