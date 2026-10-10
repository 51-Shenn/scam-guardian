import type { FeatureSnapshot } from './contract.ts';
import { preprocess, rawVector, type BundleModel } from './contextual_inference.mjs';

export interface Contribution {
  readonly feature: string;
  readonly label: string;
  readonly value: number;
  readonly missing: boolean;
}
export interface LinearExplanation {
  readonly modelId: string;
  readonly cutoffMs: number;
  readonly intercept: number;
  readonly margin: number;
  readonly thresholdMargin: number;
  readonly reconstructedScore: number;
  readonly contributions: readonly Contribution[];
}

const names: Record<string, string> = {
  request_present: 'Payment instructions available', urgency: 'Urgent payment wording', secrecy: 'Secrecy wording',
  warning_bypass: 'Instructions to ignore warnings', bank_deception: 'Instructions to mislead the bank',
  safe_account: 'A claimed safe account', remote_access: 'Remote access wording', avoid_verification: 'Discouraging independent checks',
  claimed_authority: 'Claimed bank or police authority', negated_instruction: 'Negated instructions',
  approved_detail_mismatch: 'Mock account details differ', verification_bound: 'Mock check bound to proposed details',
  back_count: 'Back navigation', step_revisit_count: 'Repeated step visits', help_count: 'Help requests',
  explicit_paste_count: 'Observed paste actions', recipient_edit_count: 'Recipient edits', amount_edit_count: 'Amount edits',
  foreground_idle_excess_ms: 'Time paused in the foreground', background_or_blur_ms: 'Time away from the window',
};

/** Exact LR logit decomposition after the frozen transform; descriptive association, not a causal explanation. */
export function explainLinear(modelId: string, model: BundleModel, row: FeatureSnapshot, threshold: number): LinearExplanation | null {
  if (model.algorithm !== 'lr' || !model.classifier) return null;
  const raw = rawVector(model, row);
  const x = preprocess(model, raw);
  const weights = model.classifier.coef[0];
  if (weights.length !== x.length || !(threshold > 0 && threshold < 1)) throw Error('Invalid explanation model');
  const intercept = model.classifier.intercept[0];
  const contributions = model.feature_names.map((feature, i) => {
    const [family, key] = feature.split(':');
    const label = names[key] ?? key.replaceAll('_', ' ');
    // Combine a feature's transformed-value term and its explicit missing-indicator term.
    return { feature, label: family === 'delta' ? `Recent change: ${label}` : family === 'stage' ? `Payment step: ${key}` : label,
      value: weights[i] * x[i] + weights[i + raw.length] * x[i + raw.length], missing: raw[i] === null };
  });
  const margin = intercept + contributions.reduce((sum, c) => sum + c.value, 0);
  return { modelId, cutoffMs: row.feature_cutoff_ms, intercept, margin, thresholdMargin: Math.log(threshold / (1 - threshold)),
    reconstructedScore: 1 / (1 + Math.exp(-Math.max(-700, Math.min(700, margin)))), contributions };
}
