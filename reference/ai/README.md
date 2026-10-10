# AI team reference files

Copied verbatim from the AI team's handoff for contract `tg-expo-demo-handoff-v1` (feature definitions `tg-features-v1`, policy `contextual-availability-policy-v2`). Do not edit them here; ask the AI team for a new version and update the hashes in `src/domain/local-api.test.ts`.

| File | Used by | sha256 |
| --- | --- | --- |
| `prepare_contract_data.mjs` | Tests only: `featuresAt` and the session generator are the parity reference for `src/domain/features.ts` | `86fa5954bdbd51c35dd5d37c38a388a152b39ba2e27344ea71c36cfab1053302` |
| `contextual_policy_v2.json` | Tests only: generator settings (seed, classes, 5 s grid, 3 s pause) | `ca985ce6b6bc6282c51d9c807e9856d71bb35f3df56884468d27cebb6c86113e` |
| `../../src/domain/contextual_inference.mjs` | The app: on-device inference (`infer`, `advanceReview`) | `01ab8a2963bb009dc08b16d6067dcce3a3fdd39e2b200daf2e1b5c1771d0560b` |

`prepare_contract_data.mjs` imports Node modules and must never be imported by app code.

## Still needed from the AI team

- The model bundle: per-model `feature_names`, preprocessor medians/centers/scales, LR coefficients, the native XGBoost JSON, and `selection` with the frozen thresholds and model hashes. Until it exists, `predict` returns `ai_unavailable` (`MODEL_UNAVAILABLE`).
- The `requestFeatures` encoder and the authored demo requests.
- Which training labels count as positive for the binary review (in particular, Struggling).
- How focus origin should be reported when the platform cannot tell user from restoration focus; the training data never contains `unknown`.
- Whether the demo must include a typed recipient field: every generated session types the recipient, while the current app picks it from a list.
