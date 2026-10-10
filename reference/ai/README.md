# AI team reference files

Copied verbatim from the AI team's handoff for contract `tg-expo-demo-handoff-v1` (feature definitions `tg-features-v1`, policy `contextual-availability-policy-v2`, selection `xgb_behavior_binary__lr_combined_binary`). Do not edit them here; ask the AI team for a new version and update the hashes in the tests.

| File | Used by | sha256 |
| --- | --- | --- |
| `prepare_contract_data.mjs` | Tests: `featuresAt` and the session generator, the parity reference for `src/domain/features.ts` | `86fa5954bdbd51c35dd5d37c38a388a152b39ba2e27344ea71c36cfab1053302` |
| `prepare_contextual_model.mjs` | Tests: `requestFeatures` and the authored requests, the reference for `src/domain/request.ts` | `36993130734c814a01d2a0254efe7e509db5b6e599f9822da2640ec1e15d95dc` |
| `contextual_policy_v2.json` | Tests: generator settings (seed, classes, 5 s grid, 3 s pause) | `ca985ce6b6bc6282c51d9c807e9856d71bb35f3df56884468d27cebb6c86113e` |
| `examples.json` | Tests: eight worked inputs with expected model, score and decision | `f98cad8b467c3d3a71c90bc679fccb2178f13eef522c05c2d54343262c4500ef` |
| `example_sessions.jsonl` | Tests: the eight raw sessions behind `examples.json`, extracted unchanged from `sessions.jsonl` | — |
| `../../src/domain/contextual_inference.mjs` | The app: on-device inference (`infer`, `advanceReview`) | `01ab8a2963bb009dc08b16d6067dcce3a3fdd39e2b200daf2e1b5c1771d0560b` |
| `../../src/domain/model/*` | The app: frozen selection, LR and XGBoost models | checked against `selection.json` |

The `.mjs` scripts here import Node modules and must never be imported by app code. `sessions.jsonl` (14 MB, 4,080 sessions) is not committed; replaying all of it through the app pipeline matched the reference at all 27,924 cutoffs with identical scores.

## Facts from the handoff that shape the app

- Both models are binary: `Normal_or_Struggling` versus `Coached`. Struggling is not a reason for an AI review.
- The models ignore simulated calls, app switching, motion, amounts and recipient history. Those can only drive the separate rule layer.
- In the training sessions the recipient is always 6 typed characters, sometimes followed by a 4-character paste (6–9 recipient edits in all). A paste occurs in about 30% of sessions of every class, so the models do not treat pasting as a coaching sign.

## Still open with the AI team

- The native XGBoost file's expected hash comes from a `manifest.json` that was not handed over; the tests pin the received file's hash.
- How focus origin should be reported when the platform cannot tell user from restoration focus; the training data never contains `unknown`.
- Android's TextInput cannot verify a paste, so `explicit_paste_count` is null there, a value the models never saw in training.
- A realistic account number has more characters than the training sessions' recipient entries. Either the demo keeps the entry within that range or the models are retrained for the real field.
