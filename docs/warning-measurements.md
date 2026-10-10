# Early warning and false-intervention measurement

Scope agreed 10 October 2026: implement these two measurements in the existing Expo mock bank app. The user's Predictive Model Track rubric also requires visible model contribution, so fixed authored request controls connect the existing request encoder to the frozen LR head. Personalization, model retraining, fuzzy logic, recipient-verification services and real banking calls are outside this change. Frozen EXP013 model files and thresholds are unchanged.

## Requirements and acceptance

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| EW-01 | Show a review warning at recipient/amount when the existing rules or AI recommend intervention. | Warning banner in the fixed transfer footer; existing review cool-down remains. |
| EW-02 | Record actual displayed-warning time separately from first positive inference and actual confirmation. | Recorder stores session-relative monotonic milliseconds; unit/integration tests check known independent timestamps. Layout is a display proxy, not proof that a person read the message. |
| EW-03 | Settle already-due model work before accepting confirmation; discard answers from a previous transfer. | Provider waits for the recorder's shared pending work, rechecks session identity and applies the current lock. |
| FIR-01 | Count at most one false intervention per annotated legitimate session, including cancellation after warning. | Normal and Struggling count as legitimate; any displayed rule/AI warning counts. |
| FIR-02 | Keep labels outside model inputs and distinguish missing data from zero. | Operator must annotate before transfer; default unlabelled; annotation locked during transfer. No warning/confirmation gives null lead, and no legitimate sessions gives null FIR. |
| PRIV-01 | Keep measurements local and bounded, with explicit export. | Latest 20 ended sessions in app-run memory; eviction count shown; web downloads JSON, Android explicitly copies JSON. No account number, recipient name, amount, message or clipboard input in measurement export. |

## Exact calculations

- **False-intervention rate:** annotated Normal/Struggling sessions with at least one displayed warning / all annotated Normal/Struggling confirmed or cancelled sessions. Guidance alone is not a warning. A warning remains intervention burden even if a legitimate payment was unfamiliar.
- **Observed warning lead:** actual confirmation timestamp minus first displayed warning timestamp. Report median only for confirmed coached sessions with both timestamps, together with the sample count and total confirmed coached denominator. Missed sessions remain explicitly reported; they are not assigned zero lead.
- **Before-review interval:** first review-entry timestamp minus first displayed-warning timestamp, for coached sessions where the warning preceded review. This is a separate checkpoint, not payment lead time.
- **Unbiased shadow lead:** not measured by this live app run. The live observed interval includes the 15-second cool-down and user response delays. A separate matched uninterrupted reference is needed to measure lead without intervention effects.

Active, abandoned and unlabelled sessions do not enter FIR or the coached lead median. The panel reports abandoned/unlabelled counts (which may overlap), cancelled coached warnings, coached confirmed misses and sessions without a successful prediction. No percentage here establishes real-world scam performance.

## Manual check and three-minute demo

Use the existing demo route and find **Warning measurements · simulated** in Guardian read-out. The measurement label is independent of the preset: select the preset first, then the intended label, before pressing Transfer. Set authored request **Unavailable** for Cases 1–6 below (the separate rubric flow uses explicit requests). Turn Guardian on via consent. Do not reload between runs. Export at the end; memory is not durable storage. On desktop the left panel scrolls; on Android/narrow web use the Guardian tab for operator controls and return to Bank app for the visible warning.

| Case | Every selection/input | Steps and purpose |
| --- | --- | --- |
| 1: legitimate payment | Preset Normal; label Normal; saved Aina; RM 50; simulated call off; app switch returned; family preview off. | Transfer → Agree → Next → type 50 → Review → Confirm. Observe actual output; do not assume no warning. Ended session enters legitimate denominator; any shown warning enters numerator. |
| 2: coached early rule warning | Preset Coached; label Coached-medium; new recipient; type dummy account 123412341234; RM 50; simulated call active; app switch returned; family preview off. | Transfer → observe banner at recipient before Next → enter account → Next → type 50 → Review → close pause with “I want to review it myself” → wait 15 seconds → Continue. Show warning timestamp, review checkpoint and confirmation timestamp. Explain that the early warning here originates from simulated rules; do not credit it to AI. |
| 3: legitimate rule false review | Preset Coached; label Normal; new recipient; same dummy account; RM 50; simulated call active but payment is an authored legitimate payment. | Transfer → observe warning → Cancel. Purpose: show that a cancelled legitimate warning still raises FIR, regardless of what the preset or model called it. |
| 4: quiet coached negative control | Preset Normal; label Coached-high; saved Aina; RM 50; call off; app switch returned; family preview off. | Repeat Case 1 while annotation states authored coached scenario with the same observable input. If no warning appears, confirmed coached miss increases and lead stays unavailable. Do not manufacture a cue to turn the miss into a detection. |
| 5: reset/exclusion | Any preset; label Unlabelled. | Transfer → Agree if asked → choose another preset before ending. Abandoned count increases; FIR denominator does not. |
| 6: hidden app | Preset Coached; label Coached-medium; call active. | Before Transfer, use simulated app switch to cover bank app; start transfer via the demo controls if available, otherwise switch away during recipient. Return before continuing. Check first warning is recorded only when the warning is rendered in the visible bank app. Simulated away time is not native app background time. |

## Earlier three-minute Predictive Model Track presentation

The current four-minute presentation is [four-minute-pitch.md](four-minute-pitch.md), with a local web manual at `/pitch-manual.html` and a shared evidence page at `/evidence`. The shorter sequence below remains a historical alternative. Current evidence includes the harder authored challenge and its failures; do not rely only on the original aggregate simulation result.

This follows the supplied five-criterion rubric. It demonstrates AI contribution separately from simulated rules; it is not a claim of competition points or real-world protection.

1. **0:00–0:30, problem and decision:** a person is about to transfer money under payment instructions. The useful decision is “continue reviewing, independently check, or cancel before confirming.” State that all money, request text, phone signals and labels are simulated.
2. **0:30–1:05, benign contrast:** preset Normal; label Normal; authored request Routine rent request; saved Aina; RM 50; call off; app switch returned; family off. Transfer → Agree if asked → Deliver authored request → Next → type 50 → wait for the next five-second model prefix → Review → Confirm → Done. Observe whether it actually warns; count it if it does. State the frozen head/threshold shown in the read-out; the score is not a probability.
3. **1:05–2:10, AI contribution and action:** preset Normal; label Coached-high; authored request Coached request with warning bypass; choose New recipient; type dummy 123412341234; RM 50; call off; switch returned; family off. Select request before Transfer → Transfer → choose New recipient → Deliver authored request → wait for the AI recommendation while still at recipient → show the fixed-footer warning → type account → Next → type 50 → Review → close pause with “I want to review it myself” → wait 15 seconds → Continue. The read-out must say the transaction rules did not request a pause and the frozen AI recommended review. Explain “the request asks you to ignore warnings and avoid a trusted check,” then recommend checking through a known contact. The contract uses only numeric request cues; no account text or external messages are read.
4. **2:10–3:00, proof and limitations:** show warning, review and confirmation timestamps; FIR numerator/denominator; download JSON. Explain the live 15-second pause is included in observed lead. Show the before-review interval separately. State that quiet scams with identical encoded evidence remain indistinguishable and that the English request encoder is pattern matching, not robust language understanding. If time permits cancel a legitimate payment with the Coached rule preset and Normal label to show burden rather than conceal a false review.

Normal/Struggling/Coached presentation comes from the app policy; the trained model outputs binary review. These few runs prove execution and accounting, not generalization or a low false-alarm rate. Present the existing frozen offline evaluation, including quiet-category failures and missing/paraphrase tests, as separate evidence rather than mixing it with live run metrics.

| Rubric criterion | Reviewable evidence | Boundary |
| --- | --- | --- |
| Problem clarity/value | Specific payer decision before confirming a mock transfer. | No fabricated financial savings. |
| Predictive rigor/data | Frozen trained heads, source hashes, unchanged thresholds, prefix/missing-value tests and label separation. | Simulation-trained; authored text; quiet misses remain. |
| Decision/action | Early notice and the existing review/cancel/cool-down flow. | Trusted-contact verification is advice, not an implemented external service. |
| Explainability/trust | Show actual request cues, warning origin, timing, numeric score and threshold in the operator read-out; use ordinary-language warning. | Input cues are not a calibrated probability or a SHAP claim. |
| Live execution/pitch | Android/web exports and browser acceptance with a three-minute sequence. | Export is not a physical-device test. |

## Validation and reproduction

From the app folder: `npm test`, `npm run lint`, `npm run typecheck`, `npm run export:platforms`. Exports cover Android and web bundling; they are not physical-device tests. See the dated validation record in [validation.md](validation.md).

Run `node scripts/check_warning_measurements.mjs` to regenerate the independent arithmetic fixture and source/model hashes under `data/processed/warning-measurements-v1`. Its illustrative 50% FIR/16-second lead are calculation examples, never measured model performance.

To independently recompute a downloaded measurement report, run `node scripts/evaluate_warning_sessions.mjs <path-to-exported-json>`. Results go to `data/processed/warning-measurements-v1/recomputed.json`; the export is preserved. The evaluator checks shape, annotations, timing and recomputes the summary. It cannot prove the operator's labels or that a person read the warning.

The unchanged rules are deliberately simulated; the generic model is simulation-trained and uncalibrated. This change implements visibility, measurement and accounting, not improved real-world recall or fewer false warnings.
