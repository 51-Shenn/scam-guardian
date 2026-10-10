/** Diagnose archived authored challenge misses and frozen-head controls without fitting or altering inference; retain correlated-sample caveats. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleBundle } from '../src/domain/bundle.ts';
import { infer } from '../src/domain/contextual_inference.mjs';
import { snapshotAt } from '../src/domain/features.ts';
import { requestFeatures } from '../src/domain/request.ts';
import { explainLinear } from '../src/domain/explanation.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const archivedPath = 'data/processed/pitch-evidence-v1/report.json';
const original = read(archivedPath);
for (const [p, digest] of Object.entries(original.hashes)) assert.equal(sha(p), digest, `Archived source changed: ${p}`);
const selection = read('src/domain/model/selection.json');
const { bundle } = assembleBundle(selection,
  { lr_combined_binary: read('src/domain/model/lr_combined_binary.json'), xgb_behavior_binary: read('src/domain/model/xgb_behavior_binary.json') },
  { xgb_behavior_binary: read('src/domain/model/xgb_behavior_binary.xgb.json') });

function wilson(k, n) {
  if (!n) return null;
  const z = 1.959963984540054, p = k / n, d = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / d;
  const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
// Independent known Wilson boundary examples guard the diagnostic arithmetic.
assert.ok(Math.abs(wilson(0, 1)[1] - 0.7934506856227626) < 1e-12);
assert.ok(Math.abs(wilson(1, 1)[0] - 0.20654931437723745) < 1e-12);

function mockRequest(c) {
  if (c.authoredRequest === null) return null;
  const changed = ['C09', 'C10'].includes(c.id), verified = c.id === 'C09';
  return { text: c.authoredRequest, approvedDetails: 'mock-A', proposedDetails: changed ? 'mock-B' : 'mock-A',
    verificationReceipt: verified ? { details: 'mock-B', source: 'mock_known_channel' } : null };
}
// Reconstruct only the archived generator's exact events; every inferred score is checked below.
function eventsFor(c, p) {
  const events = [], request = mockRequest(c);
  const add = (t, type, payload, source = 'observed_ui') => events.push({ session_id: `${c.id}-${p.id}`, event_seq: 0, event_t_ms: t, type, source, payload });
  add(0, 'session_start', { step_id: 'recipient' });
  if (request) add(p.requestAt, 'request_context', requestFeatures(request), 'authored_demo_request');
  add(p.recipientAt, 'focus', { field_id: 'recipient', origin: 'user' });
  add(p.recipientAt + 400, 'edit', { field_id: 'recipient', length_delta: 12, input_source: 'typing' });
  add(p.amountAt - 1000, 'blur', { field_id: 'recipient' });
  add(p.amountAt, 'navigate', { step_id: 'amount', direction: 'forward' });
  add(p.amountAt + 400, 'focus', { field_id: 'amount', origin: 'user' });
  add(p.amountAt + 700, 'edit', { field_id: 'amount', length_delta: 1, input_source: 'typing' });
  add(p.amountAt + 1000, 'edit', { field_id: 'amount', length_delta: 1, input_source: 'typing' });
  if (p.back) {
    add(p.amountAt + 2000, 'navigate', { step_id: 'recipient', direction: 'back' });
    add(p.amountAt + 2500, 'edit', { field_id: 'recipient', length_delta: -1, input_source: 'typing' });
    add(p.amountAt + 3500, 'edit', { field_id: 'recipient', length_delta: 1, input_source: 'typing' });
    add(p.amountAt + 4500, 'navigate', { step_id: 'amount', direction: 'forward' });
  }
  add(p.reviewAt, 'navigate', { step_id: 'review', direction: 'forward' });
  add(p.confirmAt, 'confirm', {});
  events.sort((a, b) => a.event_t_ms - b.event_t_ms).forEach((e, i) => e.event_seq = i);
  return events;
}
const availability = { editing: true, explicitPaste: true };
const rows = [], prefixAudit = [];
let parityPrefixes = 0;
for (const old of original.rows.filter(r => r.availability === 'primary')) {
  const c = original.cases.find(c => c.id === old.caseId), p = original.profiles.find(p => p.id === old.profile);
  const events = eventsFor(c, p), prefixes = [];
  let behaviorFirst = null;
  for (const expected of old.scores) {
    const input = snapshotAt(events, expected.cutoffMs, availability), prediction = infer(input, bundle);
    assert.deepEqual({ cutoffMs: prediction.featureCutoffMs, head: prediction.modelId, score: prediction.reviewScore,
      threshold: prediction.threshold, review: prediction.reviewRecommended }, expected, `Prefix parity: ${old.id}`);
    parityPrefixes++;
    const behaviorInput = { ...input, context_features: requestFeatures(null) };
    const behavior = infer(behaviorInput, bundle);
    if (behavior.reviewRecommended && behaviorFirst === null) behaviorFirst = expected.cutoffMs;
    const explanation = explainLinear(prediction.modelId, bundle.models[prediction.modelId], input, prediction.threshold);
    if (explanation) assert.ok(Math.abs(explanation.reconstructedScore - prediction.reviewScore) < 1e-12);
    prefixes.push({ cutoffMs: expected.cutoffMs, input, prediction, behaviorControl: behavior, explanation });
    prefixAudit.push({ id: old.id, ...prefixes.at(-1) });
  }
  const peak = prefixes.reduce((a, b) => b.prediction.reviewScore > a.prediction.reviewScore ? b : a);
  rows.push({ ...old, firstReviewMs: { ...old.firstReviewMs, behavior_only: behaviorFirst },
    availableRequest: requestFeatures(mockRequest(c)), peak, prefixes });
}
const warned = (r, name) => r.firstReviewMs[name] !== null;
const timely = (r, name) => warned(r, name) && r.firstReviewMs[name] >= r.onsetMs && r.firstReviewMs[name] < r.confirmMs;
function metrics(own, name) {
  const scams = own.filter(r => r.coached), benign = own.filter(r => !r.coached);
  const tp = scams.filter(r => timely(r, name)).length, fn = scams.length - tp;
  const fp = benign.filter(r => warned(r, name)).length, tn = benign.length - fp;
  return { tp, fn, fp, tn, recall: tp / scams.length, falseInterventionRate: fp / benign.length,
    precision: tp + fp ? tp / (tp + fp) : null, f1: 2 * tp / (2 * tp + fp + fn),
    illustrativeIndependentWilson95: { recall: wilson(tp, scams.length), falseInterventionRate: wilson(fp, benign.length) } };
}
const comparators = ['frozen_ai', 'behavior_only', 'request_cue_baseline', 'transaction_rules', 'hybrid'];
const comparison = Object.fromEntries(comparators.map(n => [n, metrics(rows, n)]));
for (const n of comparators.filter(n => n !== 'behavior_only')) {
  const prior = original.reports[0].comparison[n];
  for (const k of ['tp', 'fn', 'fp', 'tn']) assert.equal(comparison[n][k], prior[k]);
}
const profiles = original.profiles.map(p => ({ profile: p.id, comparison: Object.fromEntries(comparators.map(n => [n, metrics(rows.filter(r => r.profile === p.id), n)])) }));
function paired(own, other) {
  const correct = (r, n) => r.coached ? timely(r, n) : !warned(r, n);
  const groups = { bothCorrect: [], aiOnlyCorrect: [], comparatorOnlyCorrect: [], bothIncorrect: [] };
  for (const r of own) {
    const a = correct(r, 'frozen_ai'), b = correct(r, other);
    groups[a ? b ? 'bothCorrect' : 'aiOnlyCorrect' : b ? 'comparatorOnlyCorrect' : 'bothIncorrect'].push(r.id);
  }
  return { comparator: other, counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), ids: groups };
}
const pairedComparisons = ['request_cue_baseline', 'behavior_only'].map(n => ({ all: paired(rows, n), scams: paired(rows.filter(r => r.coached), n), benign: paired(rows.filter(r => !r.coached), n) }));
const reasons = {
  C04: ['recognized_cues_below_threshold', 'English urgency/authority/safe-account cues exist. Direct profile stays below the frozen threshold; hesitant profile triggers later. Cause cannot be reduced to unseen wording.'],
  C06: ['unrecognized_wording', 'Authored caution-bypass/avoid-check wording is present, but English regex flags miss it. This is an encoder miss; no fix is made.'],
  C08: ['quiet_identical', 'Model-visible evidence is identical to the legitimate C07 twin. Hidden intent is not an observable feature.'],
  C10: ['recognized_cues_below_threshold', 'Urgency, avoid-verification and mock account mismatch are available. Direct profile remains below threshold; hesitant profile triggers later.'],
  C12: ['request_absent_identical', 'No request. Behavior is identical to legitimate C11; call is a simulated rule input outside the trained head.'],
  C14: ['request_absent_identical', 'No request. All model-visible prefixes match legitimate C13. No discriminating behavioral input was authored.'],
};
const misses = rows.filter(r => r.coached && !timely(r, 'frozen_ai')).map(r => ({ id: r.id, family: r.family,
  bucket: reasons[r.caseId][0], interpretation: reasons[r.caseId][1], requestCues: r.availableRequest,
  peakScore: r.peak.prediction.reviewScore, peakHead: r.peak.prediction.modelId, peakCutoffMs: r.peak.cutoffMs,
  threshold: r.peak.prediction.threshold, peakExplanation: r.peak.explanation, baselineFirstMs: r.firstReviewMs.request_cue_baseline,
  behaviorFirstMs: r.firstReviewMs.behavior_only }));
const mass = terms => terms.reduce((out, c) => { const group = c.feature.split(':')[0]; out[group] = (out[group] ?? 0) + Math.abs(c.value); return out; }, {});
const explained = prefixAudit.filter(p => p.explanation);
const contributionMass = explained.reduce((out, p) => { for (const [k, v] of Object.entries(mass(p.explanation.contributions))) out[k] = (out[k] ?? 0) + v; return out; }, {});
const lr = bundle.models[selection.request], coefficientMass = {};
lr.feature_names.forEach((feature, i) => { const group = feature.split(':')[0], w = lr.classifier.coef[0];
  coefficientMass[group] = (coefficientMass[group] ?? 0) + Math.abs(w[i]) + Math.abs(w[i + lr.feature_names.length]); });
const identityPairs = [['C07', 'C08'], ['C11', 'C12'], ['C13', 'C14']].map(([benign, scam]) => {
  for (const p of original.profiles) {
    const a = rows.find(r => r.caseId === benign && r.profile === p.id), b = rows.find(r => r.caseId === scam && r.profile === p.id);
    assert.deepEqual(a.prefixes.map(p => p.input), b.prefixes.map(p => p.input));
  }
  return { benign, scam, exactModelInputEquality: true };
});
const out = path.join(root, 'data/processed/frozen-model-diagnosis-v1');
const report = { version: 'frozen-model-diagnosis-v1', simulationOnly: true, retrained: false, modelChanged: false,
  scope: 'Post-inspection diagnosis of development cases. Not a fresh test, human experiment or real-world effectiveness measurement.',
  uncertaintyScope: 'Wilson intervals assume independent Bernoulli observations, violated by repeated profiles/shared authored families. Illustrative only; not bounds on true population recall. Paired counts are descriptive, not significance tests.',
  controlScope: 'Behavior-only uses the frozen XGB fallback on identical behavior with request unavailable. Different head/threshold: not a causal LR feature ablation. Neither control is a newly selected model.',
  sources: { archivedReportSha256: sha(archivedPath), originalHashes: original.hashes,
    scriptSha256: sha('scripts/diagnose_frozen_model.mjs'), planSha256: sha('docs/frozen-model-diagnosis-plan.md'), node: process.version },
  parityPrefixes, sessions: rows.length, distinctCaseDefinitions: original.cases.length, families: 8,
  comparison, profiles, pairedComparisons, misses,
  missBuckets: Object.fromEntries([...new Set(misses.map(m => m.bucket))].map(k => [k, misses.filter(m => m.bucket === k).length])),
  identityPairs, coefficientMass, contributionMass, explainedPrefixes: explained.length,
  contributionScope: 'Sum of absolute transformed LR value-plus-missing-indicator terms over request-available prefixes; repeated correlated prefixes, not independent evidence. All behavior/delta/stage/request terms retained; intercept separate.',
  lrIntercept: lr.classifier.intercept[0], prefixes: prefixAudit };
const bytes = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--verify')) assert.equal(fs.readFileSync(path.join(out, 'report.json'), 'utf8'), bytes, 'Independent rerun must match');
else { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'report.json'), bytes); }
console.log(JSON.stringify({ parityPrefixes, comparison, paired: pairedComparisons.map(p => p.all.counts), missBuckets: report.missBuckets,
  coefficientMass, contributionMass, output: out, verified: process.argv.includes('--verify') }, null, 2));
