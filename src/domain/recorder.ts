import type { Outcome, Draft } from './collector.ts';
import type { DemoEvent, PredictionReply, SessionMetadata, TimelineEntry } from './contract.ts';
import { dueCutoffs } from './features.ts';
import { CONTRACT_VERSION, FEATURE_DEFINITION_VERSION, MAX_SESSIONS, SCHEMA_VERSION, type LocalGuardianApi } from './local-api.ts';
import type { AiView } from './session.ts';
import type { LinearExplanation } from './explanation.ts';
import { measurementReport, type EvaluationLabel, type SessionMeasurement, type WarningOrigin } from './measurement.ts';

export const COLLECTOR_VERSION = 'bank-app-collector-1';

export interface RecorderOptions {
  readonly api: LocalGuardianApi;
  readonly platform: SessionMetadata['platform'];
  readonly appBuild: string;
  /** An opaque per-install key: no name, phone or account number. */
  readonly localUserKey: string;
  readonly newId: () => string;
}

interface Open {
  id: string; seq: number; lastCutoff: number | null; entry: number; positive: string | null; warned: Set<string>;
  label: EvaluationLabel; firstPositiveMs: number | null; firstWarningMs: number | null; warningOrigin: WarningOrigin | null;
  reviewEnteredMs: number | null; confirmationMs: number | null; successfulPredictions: number; unavailablePredictions: number;
  pending: Promise<AiView | null> | null;
  triggerExplanation: LinearExplanation | null;
}

/**
 * Owns the contract session for one transfer: stamps events with the session clock, predicts on the
 * five-second grid, and keeps the warning timeline. Nothing here is uploaded.
 */
export function createRecorder(options: RecorderOptions) {
  const { api } = options;
  let open: Open | null = null;
  let nextLabel: EvaluationLabel = null;
  let records: SessionMeasurement[] = [];
  let evictedSessions = 0;
  const time = (s: Open) => Math.floor(api.sessionTime(s.id) ?? 0);

  function timeline(s: Open, type: TimelineEntry['type'], payload: object, at = time(s)) {
    const entry = { session_id: s.id, entry_seq: s.entry, event_t_ms: at, type, payload } as TimelineEntry;
    if (api.recordTimeline(entry).ok) { s.entry++; return true; }
    return false;
  }

  const recorder = {
    get sessionId(): string | null { return open?.id ?? null; },
    /** Lock the operator's annotation before the transfer; never send it to inference. */
    annotate(label: EvaluationLabel): boolean {
      if (open) return false;
      nextLabel = label;
      return true;
    },
    report() { return measurementReport(records, evictedSessions); },
    get measurement() {
      return open ? { sessionId: open.id, label: open.label, firstPositiveMs: open.firstPositiveMs, firstWarningMs: open.firstWarningMs, warningOrigin: open.warningOrigin } : null;
    },

    /** Opens a session for a new monitored transfer; an unfinished one is closed as abandoned first. */
    start(): void {
      if (open) recorder.end('abandoned');
      const id = options.newId();
      const started = api.startSession({
        schema_version: SCHEMA_VERSION, contract_version: CONTRACT_VERSION, feature_definition_version: FEATURE_DEFINITION_VERSION,
        collector_version: COLLECTOR_VERSION, session_id: id, local_user_key: options.localUserKey, platform: options.platform,
        app_build: options.appBuild, payment_environment: 'mock_wallet', clock: 'session-relative-monotonic-ms',
      });
      if (!started.ok) return;
      open = {
        id, seq: 0, lastCutoff: null, entry: 0, positive: null, warned: new Set(), label: nextLabel,
        firstPositiveMs: null, firstWarningMs: null, warningOrigin: null, reviewEnteredMs: null, confirmationMs: null,
        successfulPredictions: 0, unavailablePredictions: 0, pending: null, triggerExplanation: null,
      };
      recorder.record([{ type: 'session_start', source: 'observed_ui', payload: { step_id: 'recipient' } } as Draft], 0);
    },

    /** Records drafts in order. The first event is pinned to time zero, as the contract requires. */
    record(drafts: readonly Draft[], at?: number): void {
      const s = open;
      if (!s || !drafts.length) return;
      const t = at ?? time(s);
      const events = drafts.map((d, i) => {
        const payload = d.type === 'transaction' ? { ...d.payload, context_as_of_ms: t } : d.payload;
        return { session_id: s.id, event_seq: s.seq + i, event_t_ms: t, type: d.type, source: d.source, payload } as DemoEvent;
      });
      if (api.recordEvents({ session_id: s.id, events }).ok) {
        s.seq += events.length;
        if (s.reviewEnteredMs === null && drafts.some((d) => d.type === 'navigate' && 'step_id' in d.payload && d.payload.step_id === 'review')) s.reviewEnteredMs = t;
        if (drafts.some((d) => d.type === 'confirm')) s.confirmationMs = t;
      }
    },

    end(outcome: Outcome): void {
      const s = open;
      if (!s) return;
      timeline(s, 'session_end', { outcome });
      const endedMs = time(s);
      api.endSession(s.id, outcome, endedMs);
      records.push({
        sessionId: s.id, label: s.label, labelSource: 'operator_annotated_simulation', outcome,
        firstPositiveMs: s.firstPositiveMs, firstWarningMs: s.firstWarningMs, warningOrigin: s.warningOrigin,
        reviewEnteredMs: s.reviewEnteredMs, confirmationMs: s.confirmationMs, endedMs,
        successfulPredictions: s.successfulPredictions, unavailablePredictions: s.unavailablePredictions,
      });
      if (records.length > MAX_SESSIONS) { records = records.slice(-MAX_SESSIONS); evictedSessions++; }
      open = null;
    },

    /** Runs every grid prediction now due, in order, and returns the model's view for the session. */
    predictDue(): Promise<AiView | null> {
      const s = open;
      if (!s) return Promise.resolve(null);
      if (s.pending) return s.pending;
      s.pending = runDue(s).finally(() => { s.pending = null; });
      return s.pending;
    },

    /** Logs a shown warning once: what decided it, then that it became visible. */
    warn(origin: WarningOrigin): boolean {
      const s = open;
      if (!s) return false;
      const intervention_id = `${s.id}-w1`;
      if (s.warned.has(intervention_id)) return false;
      const prediction_id = origin === 'rule' ? null : s.positive;
      if (origin !== 'rule' && !prediction_id) return false;
      if (!timeline(s, 'warning_decision', { prediction_id, intervention_id, origin })) return false;
      const displayedMs = time(s);
      if (!timeline(s, 'warning_display', { intervention_id }, displayedMs)) return false;
      s.firstWarningMs = displayedMs;
      s.warningOrigin = origin;
      s.warned.add(intervention_id);
      return true;
    },

    /** What the person did after a shown warning. */
    verify(action: 'open_check' | 'continue' | 'cancel'): void {
      const s = open;
      if (!s || !s.warned.size) return;
      timeline(s, 'verification_action', { intervention_id: `${s.id}-w1`, action });
    },
  };

  async function runDue(s: Open): Promise<AiView | null> {
    let view: AiView | null = null;
    for (const cutoff of dueCutoffs(s.lastCutoff, time(s))) {
      const prediction_id = `${s.id}-p${cutoff}`;
      const reply: PredictionReply = await api.predict({ session_id: s.id, prediction_id, feature_cutoff_ms: cutoff });
      if (open !== s) return null; // the transfer ended while the model ran
      s.lastCutoff = cutoff;
      if (reply.status !== 'ok') {
        s.unavailablePredictions++;
        view = { ...(view ?? toView(null)), status: 'unavailable', cutoff, latched: s.positive !== null, triggerExplanation: s.triggerExplanation };
        if (reply.error.code === 'MODEL_UNAVAILABLE') break;
        continue;
      }
      timeline(s, 'prediction', reply);
      s.successfulPredictions++;
      const review = api.review(s.id);
      if (reply.result.reviewRecommended && !s.positive) {
        s.positive = prediction_id;
        s.firstPositiveMs = reply.inference_end_ms;
        s.triggerExplanation = api.explanation(s.id, cutoff);
      }
      view = { ...toView(reply, review?.reviewLatched ?? false), triggerExplanation: s.triggerExplanation };
    }
    return view;
  }
  return recorder;
}

export type Recorder = ReturnType<typeof createRecorder>;

function toView(reply: PredictionReply | null, latched = false): AiView {
  if (!reply || reply.status !== 'ok') return { status: 'unavailable', score: null, threshold: null, model: null, cutoff: null, latched };
  const r = reply.result;
  return { status: latched ? 'review' : 'clear', score: r.reviewScore, threshold: r.threshold, model: r.modelId, cutoff: r.featureCutoffMs, latched };
}
