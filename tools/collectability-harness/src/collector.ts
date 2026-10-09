// Collectability harness: records the fields from "Scam Guardian - Production Data
// Requirements" (C01-C09) so we can see which ones each platform can actually fill.
// No typed text, recipient names or account numbers are ever stored here.
import { Platform } from 'react-native';

export const SCHEMA_VERSION = 'harness-0.1';
export const FEATURE_DEFINITION_VERSION = 'harness-0.1';
export const COLLECTOR_VERSION = 'harness-0.1';
// The data requirements call 3 s a test definition; the harness uses it as-is.
export const PAUSE_THRESHOLD_MS = 3000;

export type StepId = 'recipient' | 'amount' | 'review' | 'done';
export type FieldId = 'account_number' | 'amount' | 'reference';
export type BackSource = 'in_app' | 'hardware' | 'browser';
export type NavigationEvent = 'forward' | 'back' | 'cancel';
export type Outcome = 'confirmed' | 'cancelled' | 'abandoned';
export type InputSource = 'paste' | 'composition' | 'autofill' | 'typing' | 'unknown';

export const monotonicNow = (): number =>
  typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now();

type FieldStats = {
  edit_event_count: number;
  last_edit_length_delta: number | null;
  negative_delta_event_count: number;
  intervals: number[];
  first_edit_t: number | null;
  last_edit_t: number | null;
  last_length: number;
  // Diagnostics (not in the contract): help decide how to treat paste on native.
  large_insert_count: number;
  // Only observable where the platform exposes the event (web DOM); null otherwise.
  paste_count: number | null;
  composition_observed: boolean | null;
  last_input_type: string | null;
  input_source: InputSource;
  focus_events: number;
  blur_events: number;
  last_focus_origin: 'user_action' | 'restoration' | 'unknown' | null;
  touch_before_last_focus: boolean | null;
};

type LogEvent = { seq: number; t: number; type: string; detail?: Record<string, string | number | boolean | null> };

export type TransactionContext = {
  amount_minor_units: number | null;
  currency: string;
  is_new_recipient: boolean | null;
  available_balance_minor_units: number | null;
  usual_transfer_amount_minor_units: number | null;
  recent_transfer_count: number | null;
  recipient_history_count: number | null;
  context_as_of: string | null;
};

export type BaselineInfo = {
  baseline_version: string | null;
  eligible_session_count: number;
  feature_observation_counts: Record<string, number>;
  baseline_statistics: Record<string, number> | null;
  baseline_available: boolean;
  baseline_quality_status: 'insufficient' | 'available';
};

const LARGE_INSERT_CHARS = 6;

const newField = (webEvents: boolean): FieldStats => ({
  edit_event_count: 0,
  last_edit_length_delta: null,
  negative_delta_event_count: 0,
  intervals: [],
  first_edit_t: null,
  last_edit_t: null,
  last_length: 0,
  large_insert_count: 0,
  paste_count: webEvents ? 0 : null,
  composition_observed: webEvents ? false : null,
  last_input_type: null,
  input_source: 'unknown',
  focus_events: 0,
  blur_events: 0,
  last_focus_origin: null,
  touch_before_last_focus: null,
});

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const std = (xs: number[]) => {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const round = (x: number | null) => (x === null ? null : Math.round(x));

export class SessionCollector {
  readonly session_id: string;
  readonly local_user_key: string;
  readonly app_build: string | null;
  readonly webEvents = Platform.OS === 'web';
  private readonly start = monotonicNow();
  private seq = 0;
  readonly log: LogEvent[] = [];

  // C04
  step: StepId = 'recipient';
  private visited = new Set<StepId>(['recipient']);
  last_navigation_event: NavigationEvent | null = null;
  back_navigation_count = 0;
  back_by_source: Record<BackSource, number> = { in_app: 0, hardware: 0, browser: 0 };
  step_revisit_count = 0;
  help_action_count = 0;
  last_field_focus_event: 'focus' | 'blur' | null = null;
  fields: Record<FieldId, FieldStats>;

  // C05
  private active = true;
  private lastInteractionT: number;
  private idleBeforeBackground = 0;
  private stepSegmentStart: number;
  step_foreground_ms: Partial<Record<StepId, number>> = {};
  max_foreground_gap_ms: number | null = null;
  pause_count = 0;
  last_app_state_event: string | null = null;
  background_duration_ms = 0;
  background_entry_count = 0;
  private backgroundStart: number | null = null;
  window_blur_count = 0; // web only diagnostic

  // C08
  decision: 'none' | 'warn' = 'none';
  warning_decision_ms: number | null = null;
  warning_display_ms: number | null = null;
  verification_action_ms: number | null = null;
  confirmation_ms: number | null = null;
  session_outcome: Outcome | null = null;

  constructor(localUserKey: string, appBuild: string | null) {
    this.local_user_key = localUserKey;
    this.app_build = appBuild;
    this.session_id = makeId();
    this.lastInteractionT = this.start;
    this.stepSegmentStart = this.start;
    this.fields = {
      account_number: newField(this.webEvents),
      amount: newField(this.webEvents),
      reference: newField(this.webEvents),
    };
    this.push('session_start');
  }

  elapsed = () => monotonicNow() - this.start;

  private push(type: string, detail?: LogEvent['detail']) {
    this.seq += 1;
    this.log.push({ seq: this.seq, t: Math.round(this.elapsed()), type, detail });
    if (this.log.length > 500) this.log.shift(); // raw history stays bounded
  }

  interaction(source: string) {
    if (!this.active) return;
    const t = monotonicNow();
    const gap = t - this.lastInteractionT;
    if (gap >= PAUSE_THRESHOLD_MS) this.pause_count += 1;
    this.max_foreground_gap_ms = Math.max(this.max_foreground_gap_ms ?? 0, gap);
    this.lastInteractionT = t;
    this.push('interaction', { source });
  }

  textChange(field: FieldId, newLength: number) {
    const f = this.fields[field];
    const t = monotonicNow();
    const delta = newLength - f.last_length;
    f.edit_event_count += 1;
    f.last_edit_length_delta = delta;
    if (delta < 0) f.negative_delta_event_count += 1;
    if (delta >= LARGE_INSERT_CHARS) f.large_insert_count += 1;
    if (f.last_edit_t !== null) f.intervals.push(t - f.last_edit_t);
    if (f.first_edit_t === null) f.first_edit_t = t;
    f.last_edit_t = t;
    f.last_length = newLength;
    this.interaction(`edit:${field}`);
    this.push('edit', { field, delta });
  }

  // Web DOM events only.
  domInput(field: FieldId, inputType: string) {
    const f = this.fields[field];
    f.last_input_type = inputType || '(empty)';
    if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') f.input_source = 'paste';
    else if (inputType === 'insertCompositionText') f.input_source = 'composition';
    else if (inputType === 'insertText' || inputType.startsWith('delete')) f.input_source = 'typing';
    else f.input_source = 'unknown';
    this.push('dom_input', { field, inputType: f.last_input_type });
  }

  domPaste(field: FieldId) {
    const f = this.fields[field];
    f.paste_count = (f.paste_count ?? 0) + 1;
    this.push('paste', { field });
  }

  domComposition(field: FieldId, phase: 'start' | 'end') {
    this.fields[field].composition_observed = true;
    this.push('composition', { field, phase });
  }

  focus(field: FieldId, kind: 'focus' | 'blur') {
    const f = this.fields[field];
    this.last_field_focus_event = kind;
    if (kind === 'focus') {
      f.focus_events += 1;
      // No platform says reliably who caused a focus, so the contract value stays
      // "unknown"; whether a touch came just before is kept only as a diagnostic.
      f.last_focus_origin = 'unknown';
      f.touch_before_last_focus = monotonicNow() - this.lastInteractionT < 500;
    } else {
      f.blur_events += 1;
    }
    this.push(kind, { field });
  }

  help() {
    this.help_action_count += 1;
    this.interaction('help');
    this.push('help');
  }

  navigate(to: StepId, event: NavigationEvent, backSource?: BackSource) {
    this.closeStepSegment();
    this.last_navigation_event = event;
    if (event === 'back') {
      this.back_navigation_count += 1;
      if (backSource) this.back_by_source[backSource] += 1;
    }
    if (this.visited.has(to)) this.step_revisit_count += 1;
    this.visited.add(to);
    this.step = to;
    this.interaction(`nav:${event}`);
    this.push('navigation', { to, event, source: backSource ?? null });
  }

  appState(next: string) {
    this.last_app_state_event = next;
    const t = monotonicNow();
    if (next === 'active' && !this.active) {
      if (this.backgroundStart !== null) this.background_duration_ms += t - this.backgroundStart;
      this.backgroundStart = null;
      this.active = true;
      // Background time is kept out of foreground gaps.
      this.lastInteractionT = t - this.idleBeforeBackground;
      this.stepSegmentStart = t;
    } else if (next !== 'active' && this.active) {
      this.closeStepSegment();
      this.idleBeforeBackground = t - this.lastInteractionT;
      this.backgroundStart = t;
      this.background_entry_count += 1;
      this.active = false;
    }
    this.push('app_state', { state: next });
  }

  windowBlur() {
    this.window_blur_count += 1;
    this.push('window_blur');
  }

  warningDecided() {
    this.decision = 'warn';
    this.warning_decision_ms = Math.round(this.elapsed());
    this.push('warning_decision');
  }
  warningDisplayed() {
    this.warning_display_ms = Math.round(this.elapsed());
    this.push('warning_display');
  }
  verified() {
    this.verification_action_ms = Math.round(this.elapsed());
    this.interaction('verify');
    this.push('verification_action');
  }

  end(outcome: Outcome) {
    if (this.session_outcome) return;
    this.closeStepSegment();
    if (outcome === 'confirmed') this.confirmation_ms = Math.round(this.elapsed());
    this.session_outcome = outcome;
    this.push('session_end', { outcome });
  }

  private closeStepSegment() {
    if (!this.active) return;
    const t = monotonicNow();
    this.step_foreground_ms[this.step] = (this.step_foreground_ms[this.step] ?? 0) + (t - this.stepSegmentStart);
    this.stepSegmentStart = t;
  }

  private currentStepForeground() {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.step_foreground_ms)) out[k] = Math.round(v ?? 0);
    if (this.active && !this.session_outcome) {
      out[this.step] = Math.round((this.step_foreground_ms[this.step] ?? 0) + monotonicNow() - this.stepSegmentStart);
    }
    return out;
  }

  // Summary kept for the personal baseline (aggregates only).
  summary() {
    const amount = this.fields.amount;
    return {
      elapsed_ms: Math.round(this.elapsed()),
      pause_count: this.pause_count,
      back_navigation_count: this.back_navigation_count,
      amount_edit_interval_mean_ms: round(mean(amount.intervals)),
    };
  }

  snapshot(tx: TransactionContext, baseline: BaselineInfo) {
    const cutoff = Math.round(this.elapsed());
    const fieldBlock = (id: FieldId) => {
      const f = this.fields[id];
      return {
        field_id: id,
        edit_event_count: f.edit_event_count,
        edit_length_delta: f.last_edit_length_delta,
        negative_delta_event_count: f.negative_delta_event_count,
        edit_interval_mean_ms: round(mean(f.intervals)),
        edit_interval_std_ms: round(std(f.intervals)),
        interval_sample_count: f.intervals.length,
        field_edit_elapsed_ms: f.first_edit_t !== null && f.last_edit_t !== null ? round(f.last_edit_t - f.first_edit_t) : null,
      };
    };
    const inputBlock = (id: FieldId) => {
      const f = this.fields[id];
      return {
        field_id: id,
        input_source: f.input_source,
        paste_count: f.paste_count,
        composition_observed: f.composition_observed,
        diag_last_input_type: f.last_input_type,
        diag_large_insert_count: f.large_insert_count,
      };
    };
    const focusBlock = (id: FieldId) => {
      const f = this.fields[id];
      return {
        field_id: id,
        focus_events: f.focus_events,
        blur_events: f.blur_events,
        focus_origin: f.last_focus_origin,
        diag_touch_before_focus: f.touch_before_last_focus,
      };
    };
    const idleNow = this.active ? monotonicNow() - this.lastInteractionT : this.idleBeforeBackground;
    return {
      C01_identifiers: {
        local_user_key: this.local_user_key,
        session_id: this.session_id,
        schema_version: SCHEMA_VERSION,
        feature_definition_version: FEATURE_DEFINITION_VERSION,
        collector_version: COLLECTOR_VERSION,
        platform: Platform.OS,
        app_build: this.app_build,
        feature_cutoff_ms: cutoff,
      },
      C02_transaction: tx,
      C03_editing: (['account_number', 'amount', 'reference'] as FieldId[]).map(fieldBlock),
      C04_navigation: {
        step_id: this.step,
        navigation_event: this.last_navigation_event,
        back_navigation_count: this.back_navigation_count,
        diag_back_by_source: { ...this.back_by_source },
        step_revisit_count: this.step_revisit_count,
        field_focus_event: this.last_field_focus_event,
        help_action_count: this.help_action_count,
        focus: (['account_number', 'amount', 'reference'] as FieldId[]).map(focusBlock),
      },
      C05_timing: {
        event_seq: this.seq,
        event_t_ms: this.log.length ? this.log[this.log.length - 1].t : null,
        elapsed_ms: cutoff,
        step_foreground_ms: this.currentStepForeground(),
        foreground_idle_ms: Math.round(idleNow),
        max_foreground_gap_ms: round(this.max_foreground_gap_ms),
        pause_count: this.pause_count,
        app_state_event: this.last_app_state_event,
        background_duration_ms: Math.round(this.background_duration_ms),
        diag_background_entry_count: this.background_entry_count,
        diag_window_blur_count: this.webEvents ? this.window_blur_count : null,
        interruption_cause: 'unknown',
      },
      C06_baseline: baseline,
      C07_input_source: {
        fields: (['account_number', 'amount', 'reference'] as FieldId[]).map(inputBlock),
        signal_availability: {
          paste: this.webEvents ? 'available' : 'unavailable',
          composition: this.webEvents ? 'available' : 'unavailable',
          autofill: 'unavailable',
          call: 'unavailable',
        },
      },
      C08_timeline: {
        model_version: 'none (harness)',
        prediction_cutoff_ms: null,
        inference_start_ms: null,
        inference_end_ms: null,
        decision: this.decision,
        warning_decision_ms: this.warning_decision_ms,
        warning_display_ms: this.warning_display_ms,
        verification_action_ms: this.verification_action_ms,
        confirmation_ms: this.confirmation_ms,
        session_outcome: this.session_outcome,
      },
      C09_call: {
        call_active: null,
        call_source: 'unknown',
        call_signal_available: false,
        call_state_changed_ms: null,
        call_observed_at_ms: null,
        call_coverage: 'none',
      },
    };
  }
}

export function makeId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
