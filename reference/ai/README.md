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

## How the bank app feeds the contract

- The new recipient's account number is a real field taking 10 to 16 digits. Each change becomes a `recipient` edit with its length change; the digits never leave the field.
- A paste counts as `explicit_paste` on web through the browser's paste event, and on both platforms through the field's Paste button. A long-press paste on Android is not observable and records as `unknown`.
- The amount keypad stands in for the amount field: its first key is the amount's user focus, each key a `typing` edit, and leaving the step its blur. Quick-amount chips record as `unknown` edits.
- Focus origin is `user` only when a touch or click on the field came within 500 ms before the focus; otherwise `unknown`.
- A saved contact is picked from a list, so those transfers have no recipient edits.

## Retraining requested (agreed on 10 Oct 2026)

The team chose a realistic account-number field over keeping entries within the training range. The frozen models were trained on 6 typed (+ 4 pasted) recipient characters and keyed amounts with focus on both fields, so app sessions fall outside that range. Scored on device, five app-shaped transfers (saved contact steady or hesitant; new recipient typed, pasted, or typed then pasted with a back step) never reached the 0.72 review threshold; typing a full 12-digit number alone raised the score to 0.36–0.46. Until the models are retrained on app-shaped sessions (10–16 digit typed or pasted accounts, keypad amounts, list-picked saved contacts), the demo's pauses come from the rule layer and the read-out says the model is not yet retrained.

## Still open with the AI team

- Retraining as above, with the same contract so the app needs no change beyond new bundle files.
- The native XGBoost file's expected hash comes from a `manifest.json` that was not handed over; the tests pin the received file's hash.
- Whether `unknown` focus origin should be handled in training; the training data never contains it.
