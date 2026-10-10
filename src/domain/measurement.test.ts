import assert from 'node:assert/strict';
import test from 'node:test';
import { measurementReport, observedLeadMs, summarizeMeasurements, type SessionMeasurement } from './measurement.ts';

const record = (patch: Partial<SessionMeasurement> = {}): SessionMeasurement => ({
  sessionId: 's1', label: 'Normal', labelSource: 'operator_annotated_simulation', outcome: 'confirmed',
  firstPositiveMs: null, firstWarningMs: null, warningOrigin: null, reviewEnteredMs: 10000,
  confirmationMs: 20000, endedMs: 20000, successfulPredictions: 4, unavailablePredictions: 0, ...patch,
});

test('FIR is per legitimate session; cancelled sessions and Struggling are retained', () => {
  const summary = summarizeMeasurements([
    record(), record({ label: 'Struggling', firstWarningMs: 3000, warningOrigin: 'rule', outcome: 'cancelled', confirmationMs: null }),
    record({ firstWarningMs: 5000, warningOrigin: 'combined' }),
    record({ label: 'Coached-high', firstWarningMs: 1000 }),
    record({ label: null, firstWarningMs: 1000 }), record({ outcome: 'abandoned', firstWarningMs: 1000 }),
  ]);
  assert.equal(summary.legitimateSessions, 3);
  assert.equal(summary.falseInterventionSessions, 2);
  assert.equal(summary.falseInterventionRate, 2 / 3);
  assert.equal(summary.abandonedSessions, 1);
  assert.equal(summary.unlabelledSessions, 1);
});

test('lead uses displayed warning, not prediction; misses stay in the denominator', () => {
  const a = record({ label: 'Coached-high', firstPositiveMs: 1000, firstWarningMs: 4000 });
  const b = record({ label: 'Coached-medium', firstWarningMs: 8000 });
  const miss = record({ label: 'Coached-high' });
  assert.equal(observedLeadMs(a), 16000);
  assert.equal(observedLeadMs(miss), null);
  const summary = summarizeMeasurements([a, b, miss]);
  assert.equal(summary.medianObservedLeadMs, 14000);
  assert.equal(summary.confirmedCoachedSessions, 3);
  assert.equal(summary.observedLeadSampleCount, 2);
  assert.equal(summary.confirmedCoachedWithoutWarning, 1);
  assert.equal(summary.medianWarningToReviewMs, 4000);
});

test('cancelled warnings have no confirmation lead and zero denominators remain unavailable', () => {
  const cancelled = record({ label: 'Coached-high', outcome: 'cancelled', firstWarningMs: 1000, confirmationMs: null });
  const summary = summarizeMeasurements([cancelled]);
  assert.equal(observedLeadMs(cancelled), null);
  assert.equal(summary.falseInterventionRate, null);
  assert.equal(summary.medianObservedLeadMs, null);
  assert.equal(summary.coachedWithWarning, 1);
  assert.equal(summarizeMeasurements([]).falseInterventionRate, null);
});

test('a simultaneous warning is zero lead, never counted as early', () => {
  const summary = summarizeMeasurements([record({ label: 'Coached-high', firstWarningMs: 20000 })]);
  assert.equal(summary.medianObservedLeadMs, 0);
  assert.equal(summary.earlyWarnedConfirmedCoachedSessions, 0);
});

test('report retains unknowns, outage counts, exclusions and simulation/retention provenance', () => {
  const report = measurementReport([record({ successfulPredictions: 0, unavailablePredictions: 2 })], 4);
  assert.equal(report.simulationOnly, true);
  assert.equal(report.personalizationUsed, false);
  assert.equal(report.retention.evictedSessions, 4);
  assert.equal(report.summary.sessionsWithoutSuccessfulPrediction, 1);
  assert.equal(report.sessions[0].observedLeadMs, null);
  assert.match(report.definitions.observedLeadMs, /cool-down/);
});
