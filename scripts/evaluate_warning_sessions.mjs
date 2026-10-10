/** Validate an exported local warning-measurement report and reproducibly recompute its summary. */
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { measurementReport, MEASUREMENT_VERSION } from '../src/domain/measurement.ts';

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: node scripts/evaluate_warning_sessions.mjs <exported-json>');
const bytes = readFileSync(inputPath);
const input = JSON.parse(bytes);
assert.equal(input.version, MEASUREMENT_VERSION);
assert.equal(input.simulationOnly, true);
assert.equal(input.personalizationUsed, false);
assert.ok(Array.isArray(input.sessions) && input.sessions.length <= 20);
assert.ok(Number.isSafeInteger(input.retention?.evictedSessions) && input.retention.evictedSessions >= 0);
const ids = new Set();
for (const s of input.sessions) {
  const allowed = ['sessionId', 'label', 'labelSource', 'outcome', 'firstPositiveMs', 'firstWarningMs', 'warningOrigin', 'reviewEnteredMs', 'confirmationMs', 'endedMs', 'successfulPredictions', 'unavailablePredictions', 'observedLeadMs'];
  assert.ok(Object.keys(s).length === allowed.length && allowed.every((k) => k in s), 'Unexpected session fields; measurement exports must contain no payment content.');
  assert.ok(typeof s.sessionId === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(s.sessionId) && !ids.has(s.sessionId));
  ids.add(s.sessionId);
  assert.ok([null, 'Normal', 'Struggling', 'Coached-medium', 'Coached-high'].includes(s.label));
  assert.equal(s.labelSource, 'operator_annotated_simulation');
  assert.ok(['confirmed', 'cancelled', 'abandoned'].includes(s.outcome));
  assert.ok(Number.isFinite(s.endedMs) && s.endedMs >= 0);
  for (const key of ['firstPositiveMs', 'firstWarningMs', 'reviewEnteredMs', 'confirmationMs']) {
    assert.ok(s[key] === null || (Number.isFinite(s[key]) && s[key] >= 0 && s[key] <= s.endedMs), key);
  }
  assert.ok([null, 'ai', 'rule', 'combined'].includes(s.warningOrigin));
  assert.equal(s.firstWarningMs === null, s.warningOrigin === null);
  if (s.warningOrigin === 'ai' || s.warningOrigin === 'combined') assert.ok(s.firstPositiveMs !== null && s.firstPositiveMs <= s.firstWarningMs);
  assert.equal(s.confirmationMs !== null, s.outcome === 'confirmed');
  if (s.firstWarningMs !== null && s.confirmationMs !== null) assert.ok(s.firstWarningMs <= s.confirmationMs, 'Warning after confirmation is invalid for this live recorder.');
  for (const key of ['successfulPredictions', 'unavailablePredictions']) assert.ok(Number.isSafeInteger(s[key]) && s[key] >= 0);
}
const recomputed = measurementReport(input.sessions, input.retention.evictedSessions);
assert.deepEqual(input.summary, recomputed.summary, 'The saved summary must match the underlying session measurements.');
const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = resolve(root, 'data/processed/warning-measurements-v1');
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, 'recomputed.json');
writeFileSync(outputPath, JSON.stringify({ inputSha256: createHash('sha256').update(bytes).digest('hex'), ...recomputed }, null, 2) + '\n');
console.log(JSON.stringify({ validatedSessions: input.sessions.length, summary: recomputed.summary, outputPath }, null, 2));
