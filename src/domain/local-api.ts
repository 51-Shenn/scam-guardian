import { advanceReview, infer, type ModelBundle, type ReviewState } from './contextual_inference.mjs';
import type {
  ApiError, ApiResult, DemoEvent, EventBatch, LocalDemoApi, PredictionReply, PredictionResult, SessionMetadata,
  SnapshotEnvelope, SnapshotRequest, TimelineEntry,
} from './contract.ts';
import { simulationAt, snapshotAt, SNAPSHOT_PERIOD_MS, type Availability } from './features.ts';

export const SCHEMA_VERSION = 'tg-expo-demo-events-v1';
export const CONTRACT_VERSION = 'tg-expo-demo-handoff-v1';
export const FEATURE_DEFINITION_VERSION = 'tg-features-v1';
export const POLICY_VERSION = 'contextual-availability-policy-v2';
/** Raw event history stays on the device and bounded: only the most recent sessions are kept. */
export const MAX_SESSIONS = 20;

/** The frozen model files, plus one hash per model id so each reply names the exact model it used. */
export interface LoadedBundle { readonly bundle: ModelBundle; readonly modelHashes: Readonly<Record<string, string>> }

export interface LocalDemoApiOptions {
  /** A monotonic clock in milliseconds, such as performance.now. Session times are measured from it. */
  readonly clock: () => number;
  /** Resolves the bundled model, or null when it is not available. Never a remote download. */
  readonly loadBundle: () => Promise<LoadedBundle | null>;
  readonly availability: Availability;
}

/** The contract's methods plus two the UI needs: the session clock and the per-session review latch. */
export interface LocalGuardianApi extends LocalDemoApi {
  sessionTime(session_id: string): number | null;
  review(session_id: string): ReviewState | null;
}

type Code = ApiError['code'];
interface Prediction { readonly cutoff: number; readonly reply: PredictionReply }
interface SessionRecord {
  readonly metadata: SessionMetadata;
  readonly origin: number;
  readonly events: DemoEvent[];
  readonly timeline: TimelineEntry[];
  readonly predictions: Map<string, Prediction>;
  readonly byCutoff: Map<number, PredictionReply>;
  readonly decided: Set<string>;
  readonly displayed: Set<string>;
  review: ReviewState | null;
  closed: boolean;
  queue: Promise<unknown>;
}

const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const FIELDS = ['recipient', 'amount', 'reference'];
const STEPS = ['recipient', 'amount', 'review'];
const CUES = ['urgency', 'secrecy', 'warning_bypass', 'bank_deception', 'safe_account', 'remote_access', 'avoid_verification',
  'claimed_authority', 'negated_instruction', 'approved_detail_mismatch', 'verification_bound'];
const SIGNALS: Record<string, string[]> = { call: ['active', 'inactive', 'unknown'], external_switch: ['away', 'returned', 'unknown'], motion: ['stationary', 'moving', 'unknown'] };

const fail = (code: Code, path: string, retryable = false): { ok: false; error: ApiError } =>
  ({ ok: false, error: { code, path, retryable, message: MESSAGES[code] } });
const ok = <T>(value: T): ApiResult<T> => ({ ok: true, value });
// Content-free messages: an error never echoes the payload.
const MESSAGES: Record<Code, string> = {
  UNSUPPORTED_VERSION: 'Unsupported contract version.', INVALID_PAYLOAD: 'The record does not match the contract.',
  SESSION_MISMATCH: 'The record belongs to a different or unknown session.', OUT_OF_ORDER: 'The record is out of order.',
  CONFLICTING_RETRY: 'A retry differs from the stored record.', FUTURE_EVENT: 'The record is later than the session clock.',
  SESSION_CLOSED: 'The session is closed.', MODEL_INCOMPATIBLE: 'The local model is not compatible with this snapshot.',
  MODEL_UNAVAILABLE: 'Local model bundle is unavailable.', SNAPSHOT_INCOMPLETE: 'The session has not started.',
};

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const exactKeys = (x: Record<string, unknown>, keys: string[]) => Object.keys(x).length === keys.length && keys.every((k) => k in x);
const count = (x: unknown) => x === null || (Number.isSafeInteger(x) && (x as number) >= 0);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Returns the path of the first contract violation in an event's type, source or payload, or null. */
function eventProblem(e: Record<string, unknown>, path: string): string | null {
  if (!exactKeys(e, ['session_id', 'event_seq', 'event_t_ms', 'type', 'source', 'payload'])) return path;
  const t = e.event_t_ms;
  if (!Number.isSafeInteger(e.event_seq) || (e.event_seq as number) < 0) return `${path}.event_seq`;
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) return `${path}.event_t_ms`;
  const p = e.payload;
  if (!isObject(p)) return `${path}.payload`;
  const keys = (...k: string[]) => exactKeys(p, k);
  const ui = e.source === 'observed_ui';
  const bad = `${path}.payload`;
  switch (e.type) {
    case 'session_start': return ui && keys('step_id') && p.step_id === 'recipient' ? null : bad;
    case 'edit': return ui && keys('field_id', 'length_delta', 'input_source') && FIELDS.includes(p.field_id as string)
      && Number.isSafeInteger(p.length_delta) && ['typing', 'explicit_paste', 'composition', 'autofill', 'unknown'].includes(p.input_source as string) ? null : bad;
    case 'focus': return ui && keys('field_id', 'origin') && FIELDS.includes(p.field_id as string) && ['user', 'restoration', 'unknown'].includes(p.origin as string) ? null : bad;
    case 'blur': return ui && keys('field_id') && FIELDS.includes(p.field_id as string) ? null : bad;
    case 'navigate': return ui && keys('step_id', 'direction') && STEPS.includes(p.step_id as string) && ['forward', 'back'].includes(p.direction as string) ? null : bad;
    case 'help': return ui && keys('step_id') && STEPS.includes(p.step_id as string) ? null : bad;
    case 'app_state': return e.source === 'observed_lifecycle' && keys('state') && ['active', 'inactive', 'background'].includes(p.state as string) ? null : bad;
    case 'window_focus': return e.source === 'observed_lifecycle' && keys('focused') && typeof p.focused === 'boolean' ? null : bad;
    case 'transaction': return e.source === 'mock_wallet'
      && keys('amount_minor_units', 'currency', 'is_new_recipient', 'available_balance_minor_units', 'recent_transfer_count', 'recipient_history_count', 'history_window_ms', 'context_as_of_ms')
      && count(p.amount_minor_units) && count(p.available_balance_minor_units) && count(p.recent_transfer_count) && count(p.recipient_history_count)
      && typeof p.currency === 'string' && /^[A-Z]{3}$/.test(p.currency) && (p.is_new_recipient === null || typeof p.is_new_recipient === 'boolean')
      && Number.isSafeInteger(p.history_window_ms) && (p.history_window_ms as number) >= 0
      && typeof p.context_as_of_ms === 'number' && p.context_as_of_ms >= 0 && p.context_as_of_ms <= t ? null : bad;
    case 'request_context': {
      if (e.source !== 'authored_demo_request' || !keys('request_present', ...CUES)) return bad;
      if (p.request_present === 0) return CUES.every((c) => p[c] === null) ? null : bad;
      return p.request_present === 1 && CUES.every((c) => p[c] === null || p[c] === 0 || p[c] === 1) ? null : bad;
    }
    case 'simulated_context': return e.source === 'simulation_button' && keys('signal', 'state')
      && (SIGNALS[p.signal as string] ?? []).includes(p.state as string) ? null : bad;
    case 'confirm': case 'cancel': return ui && keys() ? null : bad;
    default: return `${path}.type`;
  }
}

function metadataProblem(m: unknown): { code: Code; path: string } | null {
  if (!isObject(m)) return { code: 'INVALID_PAYLOAD', path: '' };
  const keys = ['schema_version', 'contract_version', 'feature_definition_version', 'collector_version', 'session_id', 'local_user_key', 'platform', 'app_build', 'payment_environment', 'clock'];
  if (!exactKeys(m, keys)) return { code: 'INVALID_PAYLOAD', path: '' };
  if (m.schema_version !== SCHEMA_VERSION) return { code: 'UNSUPPORTED_VERSION', path: 'schema_version' };
  if (m.contract_version !== CONTRACT_VERSION) return { code: 'UNSUPPORTED_VERSION', path: 'contract_version' };
  if (m.feature_definition_version !== FEATURE_DEFINITION_VERSION) return { code: 'UNSUPPORTED_VERSION', path: 'feature_definition_version' };
  for (const k of ['collector_version', 'app_build']) if (typeof m[k] !== 'string' || !(m[k] as string).length || (m[k] as string).length > 128) return { code: 'INVALID_PAYLOAD', path: k };
  for (const k of ['session_id', 'local_user_key']) if (typeof m[k] !== 'string' || !ID.test(m[k] as string)) return { code: 'INVALID_PAYLOAD', path: k };
  if (!['android', 'ios', 'web'].includes(m.platform as string)) return { code: 'INVALID_PAYLOAD', path: 'platform' };
  if (m.payment_environment !== 'mock_wallet') return { code: 'INVALID_PAYLOAD', path: 'payment_environment' };
  if (m.clock !== 'session-relative-monotonic-ms') return { code: 'INVALID_PAYLOAD', path: 'clock' };
  return null;
}

function bundleProblem(loaded: LoadedBundle): boolean {
  const { selection, models } = loaded.bundle ?? {};
  if (!selection || !models) return true;
  return [selection.request, selection.no_request].some((id) =>
    !models[id] || typeof selection.thresholds?.[id] !== 'number' || typeof loaded.modelHashes?.[id] !== 'string');
}

export function createLocalDemoApi(options: LocalDemoApiOptions): LocalGuardianApi {
  const sessions = new Map<string, SessionRecord>();
  const now = (s: SessionRecord) => options.clock() - s.origin;
  const terminal = (s: SessionRecord) => s.events.find((e) => e.type === 'confirm' || e.type === 'cancel');

  function unavailable(request: SnapshotRequest, error: { error: ApiError }): PredictionReply {
    return { status: 'ai_unavailable', session_id: request.session_id, prediction_id: request.prediction_id, prediction_cutoff_ms: request.feature_cutoff_ms, error: error.error };
  }

  function buildSnapshot(request: SnapshotRequest): ApiResult<SnapshotEnvelope> {
    if (!isObject(request) || !exactKeys(request, ['session_id', 'prediction_id', 'feature_cutoff_ms'])) return fail('INVALID_PAYLOAD', '');
    const s = sessions.get(request.session_id);
    if (!s) return fail('SESSION_MISMATCH', 'session_id');
    if (typeof request.prediction_id !== 'string' || !ID.test(request.prediction_id)) return fail('INVALID_PAYLOAD', 'prediction_id');
    const cutoff = request.feature_cutoff_ms;
    if (!Number.isSafeInteger(cutoff) || cutoff < 0 || cutoff % SNAPSHOT_PERIOD_MS !== 0) return fail('INVALID_PAYLOAD', 'feature_cutoff_ms');
    if (!s.events.length) return fail('SNAPSHOT_INCOMPLETE', 'events');
    if (cutoff > now(s)) return fail('FUTURE_EVENT', 'feature_cutoff_ms');
    const end = terminal(s);
    if (s.closed || (end && end.event_t_ms <= cutoff)) return fail('SESSION_CLOSED', 'feature_cutoff_ms');
    return ok({
      contract_version: CONTRACT_VERSION, feature_definition_version: FEATURE_DEFINITION_VERSION,
      session_id: s.metadata.session_id, local_user_key: s.metadata.local_user_key, prediction_id: request.prediction_id,
      input: snapshotAt(s.events, cutoff, options.availability), simulation_context: simulationAt(s.events, cutoff), baseline: null,
    });
  }

  async function runPrediction(s: SessionRecord, request: SnapshotRequest): Promise<PredictionReply> {
    const cached = s.predictions.get(request.prediction_id);
    if (cached) return cached.cutoff === request.feature_cutoff_ms ? cached.reply : unavailable(request, fail('CONFLICTING_RETRY', 'prediction_id'));
    const earlier = s.byCutoff.get(request.feature_cutoff_ms);
    // A new id at an evaluated cutoff reuses that result, so it cannot raise a second intervention.
    if (earlier) return { ...earlier, prediction_id: request.prediction_id };
    const snapshot = buildSnapshot(request);
    if (!snapshot.ok) return unavailable(request, snapshot);
    const loaded = await options.loadBundle().catch(() => null);
    if (!loaded) return unavailable(request, fail('MODEL_UNAVAILABLE', 'model_bundle', true));
    if (bundleProblem(loaded)) return unavailable(request, fail('MODEL_INCOMPATIBLE', 'model_bundle'));
    const start = now(s);
    let result: PredictionResult;
    try {
      result = infer(snapshot.value.input, loaded.bundle);
    } catch {
      return unavailable(request, fail('MODEL_INCOMPATIBLE', 'input'));
    }
    const end = now(s);
    if (s.closed) return unavailable(request, fail('SESSION_CLOSED', 'session_id'));
    if (s.review && request.feature_cutoff_ms < s.review.lastCutoffMs) return unavailable(request, fail('OUT_OF_ORDER', 'feature_cutoff_ms'));
    s.review = advanceReview(s.review, result);
    const reply: PredictionReply = {
      status: 'ok', session_id: request.session_id, prediction_id: request.prediction_id, model_hash: loaded.modelHashes[result.modelId],
      policy_version: POLICY_VERSION, inference_start_ms: start, inference_end_ms: end, result,
    };
    s.predictions.set(request.prediction_id, { cutoff: request.feature_cutoff_ms, reply });
    s.byCutoff.set(request.feature_cutoff_ms, reply);
    return reply;
  }

  function timelineProblem(s: SessionRecord, entry: TimelineEntry): { code: Code; path: string } | null {
    const p = entry.payload as Record<string, unknown>;
    switch (entry.type) {
      case 'prediction': return s.predictions.has((p as PredictionReply).prediction_id) ? null : { code: 'INVALID_PAYLOAD', path: 'payload.prediction_id' };
      case 'warning_decision': {
        if (typeof p.intervention_id !== 'string' || !ID.test(p.intervention_id) || s.decided.has(p.intervention_id)) return { code: 'INVALID_PAYLOAD', path: 'payload.intervention_id' };
        if (!['ai', 'rule', 'combined'].includes(p.origin as string)) return { code: 'INVALID_PAYLOAD', path: 'payload.origin' };
        if (p.origin === 'rule') return p.prediction_id === null || s.predictions.has(p.prediction_id as string) ? null : { code: 'INVALID_PAYLOAD', path: 'payload.prediction_id' };
        // An AI-origin warning needs an earlier positive prediction.
        const reply = s.predictions.get(p.prediction_id as string)?.reply;
        return reply?.status === 'ok' && reply.result.reviewRecommended ? null : { code: 'INVALID_PAYLOAD', path: 'payload.prediction_id' };
      }
      case 'warning_display': return s.decided.has(p.intervention_id as string) && !s.displayed.has(p.intervention_id as string) ? null : { code: 'OUT_OF_ORDER', path: 'payload.intervention_id' };
      case 'verification_action':
        if (!s.displayed.has(p.intervention_id as string)) return { code: 'OUT_OF_ORDER', path: 'payload.intervention_id' };
        return ['open_check', 'mock_known_contact_check', 'continue', 'cancel'].includes(p.action as string) ? null : { code: 'INVALID_PAYLOAD', path: 'payload.action' };
      case 'session_end': return ['confirmed', 'cancelled', 'abandoned'].includes(p.outcome as string) ? null : { code: 'INVALID_PAYLOAD', path: 'payload.outcome' };
      default: return { code: 'INVALID_PAYLOAD', path: 'type' };
    }
  }

  return {
    sessionTime(session_id) {
      const s = sessions.get(session_id);
      return s ? now(s) : null;
    },

    review(session_id) {
      return sessions.get(session_id)?.review ?? null;
    },

    startSession(metadata) {
      const problem = metadataProblem(metadata);
      if (problem) return fail(problem.code, problem.path);
      if (sessions.has(metadata.session_id)) return fail('SESSION_MISMATCH', 'session_id');
      sessions.set(metadata.session_id, {
        metadata, origin: options.clock(), events: [], timeline: [], predictions: new Map(), byCutoff: new Map(),
        decided: new Set(), displayed: new Set(), review: null, closed: false, queue: Promise.resolve(),
      });
      for (const [id, s] of sessions) if (sessions.size > MAX_SESSIONS && s.closed) sessions.delete(id);
      return ok(null);
    },

    recordEvents(batch: EventBatch) {
      if (!isObject(batch) || !exactKeys(batch, ['session_id', 'events']) || !Array.isArray(batch.events) || !batch.events.length) return fail('INVALID_PAYLOAD', '');
      const s = sessions.get(batch.session_id);
      if (!s) return fail('SESSION_MISMATCH', 'session_id');
      if (s.closed) return fail('SESSION_CLOSED', 'session_id');
      // Validate everything before storing anything, so a rejected batch leaves the session unchanged.
      const fresh: DemoEvent[] = [];
      let lastT = s.events.at(-1)?.event_t_ms ?? 0;
      let ended = Boolean(terminal(s));
      const clock = now(s);
      for (const [i, raw] of batch.events.entries()) {
        const path = `events[${i}]`;
        if (!isObject(raw)) return fail('INVALID_PAYLOAD', path);
        if (raw.session_id !== batch.session_id) return fail('SESSION_MISMATCH', `${path}.session_id`);
        const problem = eventProblem(raw, path);
        if (problem) return fail('INVALID_PAYLOAD', problem);
        const e = raw as unknown as DemoEvent;
        const stored = s.events[e.event_seq];
        if (stored) {
          // An exact retry of a stored event is a no-op; anything else conflicts.
          if (fresh.length || !same(stored, e)) return fail(fresh.length ? 'OUT_OF_ORDER' : 'CONFLICTING_RETRY', `${path}.event_seq`);
          continue;
        }
        if (e.event_seq !== s.events.length + fresh.length) return fail('OUT_OF_ORDER', `${path}.event_seq`);
        if (e.event_seq === 0 ? e.type !== 'session_start' || e.event_t_ms !== 0 : e.type === 'session_start') return fail('OUT_OF_ORDER', `${path}.type`);
        if (e.event_t_ms < lastT) return fail('OUT_OF_ORDER', `${path}.event_t_ms`);
        if (e.event_t_ms > clock) return fail('FUTURE_EVENT', `${path}.event_t_ms`);
        if (ended) return fail('SESSION_CLOSED', path);
        ended = e.type === 'confirm' || e.type === 'cancel';
        lastT = e.event_t_ms;
        fresh.push(e);
      }
      s.events.push(...fresh);
      return ok({ accepted_count: fresh.length, last_event_seq: s.events.length - 1 });
    },

    buildSnapshot,

    predict(request) {
      const s = isObject(request) ? sessions.get(request.session_id) : undefined;
      if (!s) return Promise.resolve(unavailable(request, fail('SESSION_MISMATCH', 'session_id')));
      // Predictions for one session run one at a time, so results can never interleave.
      const next = s.queue.then(() => runPrediction(s, request));
      s.queue = next.catch(() => undefined);
      return next;
    },

    recordTimeline(entry) {
      if (!isObject(entry) || !exactKeys(entry, ['session_id', 'entry_seq', 'event_t_ms', 'type', 'payload'])) return fail('INVALID_PAYLOAD', '');
      const s = sessions.get(entry.session_id);
      if (!s) return fail('SESSION_MISMATCH', 'session_id');
      const stored = s.timeline[entry.entry_seq];
      if (stored) return same(stored, entry) ? ok(null) : fail('CONFLICTING_RETRY', 'entry_seq');
      if (entry.entry_seq !== s.timeline.length) return fail('OUT_OF_ORDER', 'entry_seq');
      if (!Number.isFinite(entry.event_t_ms) || entry.event_t_ms < (s.timeline.at(-1)?.event_t_ms ?? 0)) return fail('OUT_OF_ORDER', 'event_t_ms');
      if (entry.event_t_ms > now(s)) return fail('FUTURE_EVENT', 'event_t_ms');
      if (s.timeline.some((x) => x.type === 'session_end')) return fail('SESSION_CLOSED', 'type');
      const problem = timelineProblem(s, entry);
      if (problem) return fail(problem.code, problem.path);
      if (entry.type === 'warning_decision') s.decided.add(entry.payload.intervention_id);
      if (entry.type === 'warning_display') s.displayed.add(entry.payload.intervention_id);
      s.timeline.push(entry);
      return ok(null);
    },

    readBaseline(local_user_key) {
      if (typeof local_user_key !== 'string' || !ID.test(local_user_key)) return fail('INVALID_PAYLOAD', 'local_user_key');
      // No baseline manager policy has been agreed, and the selected models do not use one.
      return ok(null);
    },

    endSession(session_id, outcome, end_t_ms) {
      const s = sessions.get(session_id);
      if (!s) return fail('SESSION_MISMATCH', 'session_id');
      if (s.closed) return fail('SESSION_CLOSED', 'session_id');
      if (!['confirmed', 'cancelled', 'abandoned'].includes(outcome)) return fail('INVALID_PAYLOAD', 'outcome');
      if (!Number.isFinite(end_t_ms) || end_t_ms < (s.events.at(-1)?.event_t_ms ?? 0)) return fail('OUT_OF_ORDER', 'end_t_ms');
      if (end_t_ms > now(s)) return fail('FUTURE_EVENT', 'end_t_ms');
      s.closed = true;
      return ok(null);
    },
  };
}
