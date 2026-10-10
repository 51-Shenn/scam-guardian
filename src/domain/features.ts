import type { DemoEvent, FeatureSnapshot, RequestContext, SimulationState } from './contract.ts';

/** Prediction grid and pause threshold frozen in contextual_policy_v2 (EXP013). */
export const SNAPSHOT_PERIOD_MS = 5000;
export const PAUSE_THRESHOLD_MS = 3000;
export const DELTA_WINDOW_MS = 5000;

export type Stage = FeatureSnapshot['stage'];
export type Features = FeatureSnapshot['features'];
type DeltaKey = keyof FeatureSnapshot['delta_features'];

/** Which content-free channels this platform can observe. Unavailable channels become null, never zero. */
export interface Availability {
  readonly editing: boolean;
  /** Verified paste needs a real paste event: true on web, false with React Native's TextInput. */
  readonly explicitPaste: boolean;
}

export const NO_REQUEST: RequestContext = {
  request_present: 0, urgency: null, secrecy: null, warning_bypass: null, bank_deception: null, safe_account: null,
  remote_access: null, avoid_verification: null, claimed_authority: null, negated_instruction: null,
  approved_detail_mismatch: null, verification_bound: null,
};

const DELTA_KEYS: readonly DeltaKey[] = ['back_count', 'user_focus_count', 'recipient_edit_count', 'amount_edit_count', 'foreground_idle_excess_ms'];
const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

/**
 * The twenty behaviour features at a cutoff. Mirrors featuresAt in reference/ai/prepare_contract_data.mjs:
 * the same clock walk, interaction rules, gap resets and null rules. Simulated and request events are not
 * payment interactions, and confirm/cancel are outcomes, so none of them can move the features.
 */
export function behaviourAt(events: readonly DemoEvent[], cutoff: number, availability: Availability): { stage: Stage; features: Features } {
  const seen = events.filter((e) => e.event_t_ms <= cutoff && e.type !== 'confirm' && e.type !== 'cancel'
    && e.type !== 'simulated_context' && e.type !== 'request_context');
  let step: Stage = 'recipient';
  let active = true;
  let focused = true;
  let last = 0;
  let lastInteraction = 0;
  let foreground = 0;
  let hidden = 0;
  let idle = 0;
  let maxGap = 0;
  let pauses = 0;
  const visited: Record<Stage, number> = { recipient: 1, amount: 0, review: 0 };

  const accumulate = (now: number) => {
    const duration = now - last;
    if (active && focused) {
      foreground += duration;
      maxGap = Math.max(maxGap, now - lastInteraction);
      const pauseAt = lastInteraction + PAUSE_THRESHOLD_MS;
      idle += Math.max(0, now - Math.max(last, pauseAt));
      if (last < pauseAt && now >= pauseAt) pauses++;
    } else {
      hidden += duration;
    }
    last = now;
  };

  for (const e of seen) {
    accumulate(e.event_t_ms);
    switch (e.type) {
      case 'app_state': active = e.payload.state === 'active'; lastInteraction = e.event_t_ms; break;
      case 'window_focus': focused = e.payload.focused; lastInteraction = e.event_t_ms; break;
      case 'navigate': step = e.payload.step_id; visited[step]++; lastInteraction = e.event_t_ms; break;
      case 'focus': if (e.payload.origin === 'user') lastInteraction = e.event_t_ms; break;
      case 'edit': case 'help': case 'blur': case 'transaction': lastInteraction = e.event_t_ms; break;
      default: break;
    }
  }
  accumulate(cutoff);

  const count = (match: (e: DemoEvent) => boolean) => seen.filter(match).length;
  const edits = seen.filter((e) => e.type === 'edit');
  const field = (id: 'recipient' | 'amount') => {
    const own = edits.filter((e) => e.payload.field_id === id);
    const intervals = own.slice(1).map((e, i) => e.event_t_ms - own[i].event_t_ms);
    return availability.editing
      ? { edits: own.length, negative: own.filter((e) => e.payload.length_delta < 0).length, mean: mean(intervals), samples: intervals.length }
      : { edits: null, negative: null, mean: null, samples: null };
  };
  const recipient = field('recipient');
  const amount = field('amount');

  return {
    stage: step,
    features: {
      elapsed_ms: cutoff,
      foreground_ms: foreground,
      background_or_blur_ms: hidden,
      foreground_idle_excess_ms: idle,
      max_foreground_gap_ms: maxGap,
      foreground_pause_count: pauses,
      back_count: count((e) => e.type === 'navigate' && e.payload.direction === 'back'),
      step_revisit_count: Object.values(visited).reduce((sum, v) => sum + Math.max(0, v - 1), 0),
      user_focus_count: count((e) => e.type === 'focus' && e.payload.origin === 'user'),
      restoration_focus_count: count((e) => e.type === 'focus' && e.payload.origin === 'restoration'),
      help_count: count((e) => e.type === 'help'),
      explicit_paste_count: availability.explicitPaste ? edits.filter((e) => e.payload.input_source === 'explicit_paste').length : null,
      recipient_edit_count: recipient.edits,
      recipient_negative_delta_count: recipient.negative,
      recipient_edit_interval_mean_ms: recipient.mean,
      recipient_interval_sample_count: recipient.samples,
      amount_edit_count: amount.edits,
      amount_negative_delta_count: amount.negative,
      amount_edit_interval_mean_ms: amount.mean,
      amount_interval_sample_count: amount.samples,
    },
  };
}

/** The request cues known at the cutoff: the latest authored request, or none. */
export function requestAt(events: readonly DemoEvent[], cutoff: number): RequestContext {
  const latest = events.filter((e) => e.type === 'request_context' && e.event_t_ms <= cutoff).at(-1);
  return latest?.type === 'request_context' ? latest.payload : NO_REQUEST;
}

/** The model's numeric input at a cutoff: features, five-second deltas and request cues. */
export function snapshotAt(events: readonly DemoEvent[], cutoff: number, availability: Availability): FeatureSnapshot {
  const now = behaviourAt(events, cutoff, availability);
  const before = behaviourAt(events, Math.max(0, cutoff - DELTA_WINDOW_MS), availability).features;
  const delta = (key: DeltaKey) => {
    const a = now.features[key];
    const b = before[key];
    return a === null || b === null ? null : a - b;
  };
  return {
    feature_cutoff_ms: cutoff,
    stage: now.stage,
    features: now.features,
    delta_features: Object.fromEntries(DELTA_KEYS.map((k) => [k, delta(k)])) as FeatureSnapshot['delta_features'],
    context_features: requestAt(events, cutoff),
  };
}

/** Simulation-button state at a cutoff, kept apart from observed signals. Unknown until a button sets it. */
export function simulationAt(events: readonly DemoEvent[], cutoff: number): SimulationState {
  const state = { source: 'simulation_button' as const, call: 'unknown', external_switch: 'unknown', motion: 'unknown' } as Record<string, string>;
  for (const e of events) {
    if (e.event_t_ms > cutoff) break;
    if (e.type === 'simulated_context') state[e.payload.signal] = e.payload.state;
  }
  return state as unknown as SimulationState;
}

/**
 * Simulated time in another app up to a cutoff, from the external_switch button's events. Only intervals with a
 * known start count: a switch never pressed gives null, not zero. Not a model input; the selected models ignore it.
 */
export function simulatedAwayMs(events: readonly DemoEvent[], cutoff: number): number | null {
  let known = false;
  let since: number | null = null;
  let total = 0;
  for (const e of events) {
    if (e.event_t_ms > cutoff) break;
    if (e.type !== 'simulated_context' || e.payload.signal !== 'external_switch') continue;
    if (e.payload.state === 'away') {
      known = true;
      since ??= e.event_t_ms;
    } else if (e.payload.state === 'returned') {
      known = true;
      if (since !== null) total += e.event_t_ms - since;
      since = null;
    }
  }
  if (since !== null) total += cutoff - since;
  return known ? total : null;
}

/** Grid cutoffs not yet evaluated, up to now. A session that ends before the next grid point gets no further prediction. */
export function dueCutoffs(lastEvaluated: number | null, now: number): number[] {
  const due: number[] = [];
  for (let t = lastEvaluated === null ? 0 : lastEvaluated + SNAPSHOT_PERIOD_MS; t <= now; t += SNAPSHOT_PERIOD_MS) due.push(t);
  return due;
}
