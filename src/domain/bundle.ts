import type { BundleModel, ModelBundle } from './contextual_inference.mjs';
import type { LoadedBundle } from './local-api.ts';

/** The frozen selection: which model runs with and without a request, its threshold, and each model file's hash. */
export interface Selection {
  readonly id: string;
  readonly no_request: string;
  readonly request: string;
  readonly thresholds: Readonly<Record<string, number>>;
  readonly model_sha256: Readonly<Record<string, string>>;
}

/** Assembles the AI team's files as run_contextual_inference.mjs does, without file system access. */
export function assembleBundle(selection: Selection, models: Readonly<Record<string, BundleModel>>, native: Readonly<Record<string, unknown>>): LoadedBundle {
  const bundle: ModelBundle = {
    selection: { request: selection.request, no_request: selection.no_request, thresholds: selection.thresholds },
    models,
    native,
  };
  // Each reply names the exact model through the selection's frozen file hash.
  return { bundle, modelHashes: selection.model_sha256 };
}
