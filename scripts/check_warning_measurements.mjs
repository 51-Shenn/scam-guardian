/** Reproduce a known arithmetic fixture, validate its export, and preserve source/model hashes without claiming effectiveness. */
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { measurementReport } from '../src/domain/measurement.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = resolve(root, 'data/processed/warning-measurements-v1');
mkdirSync(dir, { recursive: true });
const session = (id, patch = {}) => ({
  sessionId: id, label: 'Normal', labelSource: 'operator_annotated_simulation', outcome: 'confirmed',
  firstPositiveMs: null, firstWarningMs: null, warningOrigin: null, reviewEnteredMs: 10000,
  confirmationMs: 20000, endedMs: 20000, successfulPredictions: 4, unavailablePredictions: 0, ...patch,
});
const fixture = measurementReport([
  session('normal'),
  session('false-review', { label: 'Struggling', outcome: 'cancelled', confirmationMs: null, firstWarningMs: 3000, warningOrigin: 'rule' }),
  session('coached-warning', { label: 'Coached-high', firstPositiveMs: 1000, firstWarningMs: 4000, warningOrigin: 'ai' }),
  session('quiet-miss', { label: 'Coached-high' }),
], 0);
assert.equal(fixture.summary.falseInterventionRate, 0.5, 'One warned legitimate session / two legitimate sessions.');
assert.equal(fixture.summary.medianObservedLeadMs, 16000, '20,000 ms confirmation - 4,000 ms warning.');
assert.equal(fixture.summary.confirmedCoachedWithoutWarning, 1);
const fixturePath = resolve(dir, 'arithmetic-fixture.json');
writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n');
const result = spawnSync(process.execPath, [resolve(root, 'scripts/evaluate_warning_sessions.mjs'), fixturePath], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const files = ['src/domain/measurement.ts', 'src/domain/recorder.ts', 'src/domain/guardian.ts', 'src/domain/collector.ts', 'src/domain/request.ts', 'src/components/bank/session.tsx',
  'src/components/bank/early-warning.tsx', 'src/domain/model/selection.json', 'src/domain/model/lr_combined_binary.json',
  'src/domain/model/xgb_behavior_binary.json', 'src/domain/model/xgb_behavior_binary.xgb.json'];
const hashes = Object.fromEntries(files.map((file) => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')]));
writeFileSync(resolve(dir, 'arithmetic-check.json'), JSON.stringify({
  simulationOnly: true, purpose: 'Arithmetic/integration fixture; these numbers are NOT model performance.',
  node: process.version, checks: ['independent FIR arithmetic', 'independent lead arithmetic', 'quiet miss retained', 'export validation and recomputation'], hashes,
}, null, 2) + '\n');
console.log('4 arithmetic/export checks passed. Authored fixture numbers are not model performance.');
