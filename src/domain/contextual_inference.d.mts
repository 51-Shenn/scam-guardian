// Types for the AI team's portable runtime in contextual_inference.mjs. The runtime itself is kept verbatim.
import type { FeatureSnapshot, PredictionResult } from './contract.ts';

export interface BundleModel {
  readonly algorithm: 'lr' | 'xgb';
  /** Feature families: raw:<key>, delta:<key>, stage:<stage>, request:<cue>. */
  readonly feature_names: readonly string[];
  readonly preprocessor: { readonly medians: readonly number[]; readonly centers: readonly number[]; readonly scales: readonly number[] };
  readonly classifier?: { readonly coef: readonly (readonly number[])[]; readonly intercept: readonly number[] };
}

export interface ModelBundle {
  readonly selection: { readonly request: string; readonly no_request: string; readonly thresholds: Readonly<Record<string, number>> };
  readonly models: Readonly<Record<string, BundleModel>>;
  /** Native XGBoost JSON exports, keyed like models. */
  readonly native?: Readonly<Record<string, unknown>>;
}

export interface ReviewState {
  readonly lastCutoffMs: number;
  readonly firstReviewMs: number | null;
  readonly reviewLatched: boolean;
  readonly latest: PredictionResult;
}

export function preprocess(model: BundleModel, raw: readonly (number | null)[]): number[];
export function rawVector(model: BundleModel, row: FeatureSnapshot): (number | null)[];
export function probability(model: BundleModel, raw: readonly (number | null)[], native?: unknown): number;
export function infer(row: FeatureSnapshot, bundle: ModelBundle): PredictionResult;
export function advanceReview(previous: ReviewState | null, result: PredictionResult): ReviewState;
