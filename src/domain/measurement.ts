/** Evaluation annotations stay outside the model. These are simulated ground truth, never predictions. */
export type EvaluationLabel = 'Normal' | 'Struggling' | 'Coached-medium' | 'Coached-high' | null;
export type WarningOrigin = 'ai' | 'rule' | 'combined';

export interface SessionMeasurement {
  readonly sessionId: string;
  readonly label: EvaluationLabel;
  readonly labelSource: 'operator_annotated_simulation';
  readonly outcome: 'confirmed' | 'cancelled' | 'abandoned';
  readonly firstPositiveMs: number | null;
  readonly firstWarningMs: number | null;
  readonly warningOrigin: WarningOrigin | null;
  readonly reviewEnteredMs: number | null;
  readonly confirmationMs: number | null;
  readonly endedMs: number;
  readonly successfulPredictions: number;
  readonly unavailablePredictions: number;
}

export const MEASUREMENT_VERSION = 'warning-measurement-v1';

/** A missing warning or confirmation has no lead time, not a fabricated zero. Live pauses are included. */
export function observedLeadMs(s: SessionMeasurement): number | null {
  return s.firstWarningMs !== null && s.confirmationMs !== null
    ? s.confirmationMs - s.firstWarningMs : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

/** Session-level burden, with cancellation retained and abandoned/unlabelled attempts explicitly excluded. */
export function summarizeMeasurements(records: readonly SessionMeasurement[]) {
  const eligible = records.filter((s) => s.outcome !== 'abandoned' && s.label !== null);
  const legitimate = eligible.filter((s) => s.label === 'Normal' || s.label === 'Struggling');
  const falseInterventions = legitimate.filter((s) => s.firstWarningMs !== null).length;
  const coached = eligible.filter((s) => s.label === 'Coached-medium' || s.label === 'Coached-high');
  const confirmed = coached.filter((s) => s.outcome === 'confirmed');
  const leads = confirmed.map(observedLeadMs).filter((ms): ms is number => ms !== null);
  return {
    legitimateSessions: legitimate.length,
    falseInterventionSessions: falseInterventions,
    falseInterventionRate: legitimate.length ? falseInterventions / legitimate.length : null,
    coachedSessions: coached.length,
    coachedWithWarning: coached.filter((s) => s.firstWarningMs !== null).length,
    confirmedCoachedSessions: confirmed.length,
    confirmedCoachedWithoutWarning: confirmed.filter((s) => s.firstWarningMs === null).length,
    earlyWarnedConfirmedCoachedSessions: leads.filter((ms) => ms > 0).length,
    observedLeadSampleCount: leads.length,
    medianObservedLeadMs: median(leads),
    // This interval ends before the review cool-down; it is a checkpoint, not payment lead time.
    medianWarningToReviewMs: median(coached.filter((s) => s.firstWarningMs !== null && s.reviewEnteredMs !== null && s.firstWarningMs < s.reviewEnteredMs)
      .map((s) => s.reviewEnteredMs! - s.firstWarningMs!)),
    abandonedSessions: records.filter((s) => s.outcome === 'abandoned').length,
    unlabelledSessions: records.filter((s) => s.label === null).length,
    sessionsWithoutSuccessfulPrediction: eligible.filter((s) => s.successfulPredictions === 0).length,
  };
}

export function measurementReport(records: readonly SessionMeasurement[], evictedSessions: number) {
  return {
    version: MEASUREMENT_VERSION, simulationOnly: true, personalizationUsed: false,
    policy: 'contextual-availability-policy-v2', scope: 'displayed rule + AI warnings',
    retention: { retainedSessions: records.length, evictedSessions, storage: 'app-run memory; export before reload' },
    definitions: {
      falseInterventionRate: 'Annotated Normal/Struggling confirmed or cancelled sessions with >=1 displayed warning / all such sessions.',
      observedLeadMs: 'Actual confirmation time minus first displayed warning time; includes cool-down and user response delays.',
      unbiasedShadowLeadMs: 'Not measured by this live run. Requires a separate uninterrupted matched reference.',
      warningToReviewMs: 'First review-entry time minus first warning time, only when the warning precedes review.',
    },
    summary: summarizeMeasurements(records),
    sessions: records.map((s) => ({ ...s, observedLeadMs: observedLeadMs(s) })),
  };
}
