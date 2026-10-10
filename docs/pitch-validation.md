# Four-minute pitch delivery validation — 10 October 2026

## Delivered and checked

- Shared Android/web decision support: policy category, priority, plain-language reason and specific next action. The trained output remains binary review, not a newly trained scam-type classifier.
- Exact LR first-positive explanation includes every transformed feature and missing-indicator contribution plus the intercept. Reconstruction/decision equality tests pass; the UI shows largest positive terms and largest offsetting term. The first positive explanation survives later prefixes and unavailability. XGB attribution is explicitly unavailable.
- Independent-check guide opens in the review sheet, advises a previously known contact route and offers cancellation. It neither calls anyone nor certifies a recipient. Opening the guide is not evidence that verification was performed.
- Equal-length account replacement now produces an edit event with length delta zero; duplicate unchanged values do not. Account contents remain absent from snapshots.
- `/evidence` covers all five rubric criteria, preserving the original simulation results, harder new challenge, stronger simple comparator, missing-channel degradation and quiet misses. Current-run measurements remain separate from static model results.
- `/pitch-manual.html`, generated from `docs/four-minute-pitch.md`, has exact fields, actions, **354 spoken words**, four-minute allocations, fallback and judge Q&A. A pilot template is prepared, **not executed**.

## Executed verification

| Check | Result | Scope |
| --- | --- | --- |
| Domain tests | 78/78 pass | Frozen-model parity, contracts, collector, timing, policy and exact explanations; not accuracy |
| Lint / TypeScript | Pass | App and root scripts |
| Android + web exports | Pass | Hermes bytecode and static web; no physical-device/runtime result |
| Authored challenge reproduction | Byte-identical report | Fixed script, feature/encoder/model hashes, cached historical-source hash; no fitting/tuning |
| Independent export arithmetic | Pass | FIR 1/2, 16,000 ms subtraction, retained quiet miss; illustrative arithmetic only |
| Output containment | Pass | Attempt to write outside project data/processed rejected before a directory/write |
| Actual hidden Edge browser checks | 18/18 pass | Desktop 1440 and narrow web 390, explanation, guide, cancellation, exported/recomputed JSON, all five evidence tabs and manual |
| Visual review | Performed | Warning, guide, five evidence chapters, narrow evidence and narrow manual screenshots |

The first sandbox export failed because Hermes could not write its sandbox temporary bytecode. The authorized external export succeeded. A later Android export took approximately 193 seconds but completed; this is build time, not inference latency. The first browser rehearsal reached guide/cancellation, then the driver failed to locate a native HTML button because it searched only explicit role attributes. The locator now covers native and role-based buttons; final run has zero runtime exceptions. Earlier failed-run evidence remains locally, excluded from Git alongside browser profiles.

Accepted evidence: `data/processed/pitch-evidence-v1/browser/run-1791638207205/acceptance.json`. The presenter report has four authored sessions: a deliberate cancelled legitimate rule false review, a confirmed AI review, an unwarned routine payment and an AI-reviewed cancellation. This deliberately adverse fixture gives **1/2 legitimate sessions = 50% FIR**, not a population estimate. The confirmed coached session has **19.723 s observed warning-to-confirmation**, including the 15-second hold; the median before-review checkpoint across the coached runs is **2.017 s**. Cancellation has `confirmationMs:null` and `observedLeadMs:null`. Each presenter export was independently validated/recomputed. These are browser observations of simulated actions, not human efficacy or phone latency.

## Fixed authored challenge results

Primary: 16 predeclared cases × two correlated direct/hesitant profiles; 16 coached and 16 legitimate sessions. Labels never enter inference. All categories remain in the aggregate.

| Comparator | TP / FN / FP / TN | Recall | F1 | Legitimate reviews |
| --- | --- | --- | --- | --- |
| Transaction rules | 2 / 14 / 2 / 14 | 12.5% | 0.200 | 2/16 = 12.5% |
| Frozen EXP013 AI | 6 / 10 / 2 / 14 | 37.5% | 0.500 | 2/16 = 12.5% |
| Rules + AI OR policy | 8 / 8 / 4 / 12 | 50.0% | 0.571 | 4/16 = 25.0% |
| Hand-set request-cue baseline | 8 / 8 / 2 / 14 | 50.0% | 0.615 | 2/16 = 12.5% |

Missing-editing stress and missing-editing-plus-paste stress each evaluate the same 32 cases separately: AI recall 12/16 =75%, F1 .706, legitimate reviews 6/16 =37.5%. Increased recall comes with increased burden, not an improvement claim. These 96 executions do not represent 96 independent users. No weights, thresholds or English cue patterns changed after seeing results. The diagnostic baseline is unvalidated and is not silently deployed over the model.

The original EXP013 report is included byte-for-byte as a provenance snapshot: 647/720 coached detections, 2/720 benign AI warnings, F1 .945215, quiet 0/60. It repeats authored wording banks across profile splits. New challenge values must not be mixed with those denominators. Neither dataset establishes real-world recall, calibrated probability, AI superiority or low population false alarms.

## Reproduce

From the app folder:

```powershell
npm test
npm run lint
npm run typecheck
node scripts/evaluate_pitch_evidence.mjs --verify
node scripts/build_pitch_manual.mjs
npm run export:platforms
node scripts/browser_warning_measurements.mjs --pitch
node scripts/preview.mjs dist 4173
```

For an exported report use `node scripts/evaluate_warning_sessions.mjs <json> <output-directory>`; the optional output must resolve inside this project's `data/processed`. Source exports are preserved. Browser replays write derived reports in their own run folders, leaving earlier measurement records unchanged. Export before reloading; no durable live-session store was added.

## Still requires people or a device

Four-minute spoken rehearsal on the venue display, consented comprehension/decision pilot, physical Android release run/latency, independent authors/languages and field outcomes. Automated cancellation is a scripted choice, not evidence that participants make better decisions. Personalization remains deferred. Top-band scoring is not certified by this delivery.
