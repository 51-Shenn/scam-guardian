import type { BundleModel } from './contextual_inference.mjs';
import { assembleBundle, type Selection } from './bundle.ts';
import type { LoadedBundle } from './local-api.ts';
import lr from './model/lr_combined_binary.json';
import selection from './model/selection.json';
import xgb from './model/xgb_behavior_binary.json';
import xgbNative from './model/xgb_behavior_binary.xgb.json';

// The AI team's frozen EXP013 policy, bundled with the app. File hashes are checked in model.test.ts.
const MODEL_BUNDLE = assembleBundle(
  selection as Selection,
  { lr_combined_binary: lr as unknown as BundleModel, xgb_behavior_binary: xgb as unknown as BundleModel },
  { xgb_behavior_binary: xgbNative },
);

/** The on-device model bundle for createLocalDemoApi. It ships inside the app; nothing is downloaded. */
export const loadModelBundle = async (): Promise<LoadedBundle> => MODEL_BUNDLE;
