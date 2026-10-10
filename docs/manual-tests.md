# Manual testing: current integrated Scam Guardian app

Prepared 10 October 2026. All requests, recipients, calls, payments and scenario labels are simulated. Test the current frozen EXP013 model plus the existing demonstration rules. EXP016's exploratory retuned and embedding candidates are not installed in this app. Personalization is deferred.

Open [the app](/demo) on the same deployment as this manual. For a local preview, use `http://127.0.0.1:4173/demo`. The older website on port 8084 is a different tester. These new IDs, MT01–MT10, do not refer to the earlier T01–T10 records. All cases below are **not executed by the user yet**; expected outcomes are specifications or explicitly marked expectations, not new accuracy results.

## Before testing

1. Use a fresh browser tab for an empty report. Keep the same tab for all ten cases; do not refresh. On desktop, scroll inside the left Guardian panel. On narrow screens, use the Guardian tab for controls and Bank app for the transfer.
2. For each case, select the preset first, then the evaluation label and authored request before pressing Transfer. Presets reset transfer controls and can abandon an active session; never change preset to force an outcome after starting.
3. Turn Guardian on with **Agree and turn on** if prompted. Leave **Let Aina be asked to call me if a transfer is paused** off for every case. This is the family-preview consent, not real messaging.
4. Set simulated call and app-switch controls exactly as specified. **Start simulated call** changes off → active; **End simulated call** changes active → off. **Simulate app switch** changes in-bank → away; **Return to bank app** changes away → in-bank. These buttons do not detect real calls or other apps.
5. Use only the dummy account `123412341234`. Amounts are entered with the mock bank's numeric keypad, not a free-text field. Its usual amount is the fixed demonstration value RM 50; this is not a learned personal baseline.
6. The model scores on five-second prefixes. Where instructed to wait, keep the bank visible until **AI review (on device)** shows a scored cutoff after the relevant action. Allow up to 15 seconds for the manual observation window. If it remains Waiting or Unavailable, record that explicitly; do not interpret it as a negative prediction. This window is a testing procedure, not a promised latency target.
7. Record each case's last session ID immediately after confirming or cancelling. The export has no MT case ID, so keep the ID-to-case mapping yourself. Download an export after each case for safety, and one final export after MT10. Do not infer detection accuracy from the preset's name.

## What each field means

| Field | Meaning and how to set it |
| --- | --- |
| Demo preset | Sets mock starting signals. Normal uses a saved recipient and call off. Struggling adds mock back-navigation difficulty. Coached uses new recipient and call on. Coached, high also starts new/call on; paste or amount evidence determines the stronger rule response. |
| Evaluation label | Your predeclared simulated ground truth: Normal/Struggling are legitimate; Coached-medium/Coached-high are coached. It is locked during a transfer and is not a model input. |
| Authored request | Choose Unavailable, Routine rent request, Coached request with warning bypass, or Quiet request (negative control). These are fixed fixtures, not messages captured from a messaging app. |
| Deliver authored request | Makes the selected fixture available during this transfer. Merely selecting it does not deliver it. A new transfer starts with request context unavailable. |
| Recipient | Choose Aina, a saved contact, or New recipient. The dummy account field applies only to a new recipient. |
| Account number | Dummy UI value; its contents are excluded from the model and metrics export. Typing/paste/edit counters may affect behavior features. |
| Amount | Mock payment amount. The demonstration rules compare it with RM 50. Local collection records mock transaction context separately from selected model features; the warning-metrics download excludes the amount. |
| Call / app switch | Explicit simulated state changes. Neither is a newly trained phone feature. The app read-out shows cumulative simulated away duration. |
| Family preview | Separate consent for a mock alert on this screen. Keep off throughout this manual. Nothing goes to a second phone. |
| AI review | Frozen model output: review/no additional review. Score is uncalibrated and is not a scam probability. Waiting/Unavailable are separate states. The read-out says Checking payment while awaiting its first score and No warning currently after an unwarned assessment; neither means 100% safe. Request context says selected/not delivered, delivered, or unavailable, with the actual model ID once scoring succeeds. |
| Decision support | Plain-language reason, policy category, priority and next action. Normal/Struggling/Coached display categories are policy outputs, not three learned model classes. |
| Warning origin | Rule, AI or combined. Credit AI only if it actually contributed; a rule warning alone is not evidence of AI detection. |
| Warning measurements | Actual warning-display, review and confirmation timestamps, session outcomes and interruption counts. Display timestamp is a rendering proxy, not proof you read the warning. |

## Every selection for every case

Guardian **on**, family preview **off**, dummy account **typed**, and app switch **in bank** apply unless explicitly stated otherwise. Apply all these common settings for every row. Labels below describe authored role-play only.

| ID / purpose | Preset | Evaluation label | Authored request | Recipient / account | Amount | Simulated call | App switch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MT01: legitimate reference | Normal | Normal | Routine rent request | Aina saved / N/A | RM 50 | Off | In bank |
| MT02: AI contribution, explanation, cancellation | Normal | Coached-high | Coached request with warning bypass | New / `123412341234` | RM 50 | Off | In bank |
| MT03: quiet scam limitation | Normal | Coached-high | Quiet request (negative control) | Aina saved / N/A | RM 50 | Off | In bank |
| MT04: early rule warning and timing | Coached | Coached-medium | Unavailable | New / `123412341234` | RM 50 | Active | In bank |
| MT05: legitimate false intervention | Coached | Normal | Unavailable | New / `123412341234` | RM 50 | Active | In bank |
| MT06: difficulty versus suspicion | Struggling | Struggling | Routine rent request | Aina saved / N/A | RM 50 | Off | In bank |
| MT07: repeated external-app visits | Normal | Normal | Routine rent request | Aina saved / N/A | RM 50 | Off | Away 3 s, return; away 4 s, return |
| MT08: call toggling without new recipient | Normal | Normal | Unavailable | Aina saved / N/A | RM 50 | Off → active 3 s → off → active 2 s → off | In bank |
| MT09: missing request context | Normal | Coached-high | Unavailable | New / `123412341234` | RM 50 | Off | In bank |
| MT10: amount-rule boundary | Coached | Coached-medium | Unavailable | New / `123412341234` | RM 150, then RM 151 before ending | Active | In bank |

## Exact actions and evidence

If the display stays Normal/no warning, first check which case you are running. MT01's routine request is intended as a benign reference. Selecting an evaluation label does not force a model prediction. For MT02, choose the coached request before Transfer and press the dark **Deliver authored request** button during the monitored transfer; confirm that it says **Authored request delivered**. Wait for a scored cutoff after delivery. The policy labels are status indicators, not confidence bars. If MT02 still does not warn, keep that result and export it rather than switching presets to force an AI success.

### MT01 — legitimate reference

1. Apply the MT01 row. Press Transfer; agree if asked. Select Aina if necessary.
2. Press **Deliver authored request**, then Next. Press keypad **5**, **0**. Wait for a scored prefix after delivery.
3. Press Review. If an unexpected warning appears, keep label Normal, record it, choose **I want to review it myself**, and wait for the pause to finish.
4. Press Confirm transfer, or Continue with transfer if a pause occurred, then Done.

Expected: prior scripted reference completed unwarned, but live behavior can differ. One legitimate confirmed session enters the FIR denominator. Any actual displayed warning enters its numerator, even if you consider a precaution useful. No warning does not prove safety.

### MT02 — AI warning, explanation and independent-check action

1. Finish or cancel any current transfer. At Home, press **Prepare MT02 · AI warning test** in the Guardian panel. This selects the Normal preset (call off / in bank), Coached-high evaluation label and **Coached request with warning bypass**. It configures inputs without forcing a positive prediction. Keep family preview off. Press Transfer → agree and turn on if prompted → New recipient. Press **Deliver authored request** while still at recipient; leave the account empty for the initial observation.
2. Wait for a scored prefix, up to 15 seconds. Inspect AI review and warning origin. The transaction rules should stay quiet with call off and this ordinary amount.
3. If AI recommends review, capture the recipient-step banner, category, priority, next action and **Why the first AI review fired** contribution breakdown. A prior scripted run warned here; a live miss remains a miss.
4. Type `123412341234` → Next → keypad 5, 0 → Review. If the pause sheet appears, open **Open independent-check guide**, then **Cancel this transfer**. If it does not, record the miss and use Cancel.

Expected software behavior: guide gives a trusted-contact route and cancellation ends the transfer. AI evidence requires an actual AI recommendation. Cancelled coached sessions have no confirmation lead; do not invent one. A before-review interval exists only if a warning really appeared before review.

If there is no warning, inspect **AI review (on device)** before leaving the transfer. The selected request must read **Coached request with warning bypass**, request context must say **delivered to this transfer**, and the next scored model should be **lr_combined_binary**. **xgb_behavior_binary** is the behavior-only route, used while request context is unavailable to that scored prefix. Note the cutoff, score and threshold; keep a screenshot. A scored LR answer below its frozen threshold is a model miss, not a successful warning. Waiting/Unavailable is a different failure. The score is not a scam probability. The metrics download does not contain these detailed inputs, so it cannot alone diagnose which request was selected.

### MT03 — quiet scam negative control

1. Apply MT03. Repeat MT01's timings and navigation as closely as possible: Transfer → Aina → Deliver authored request → Next → 5, 0 → scored prefix → Review → confirm → Done.
2. Keep the Coached-high annotation even if everything looks normal. Log any warning rather than trying to suppress it.

Expected model limitation: routine and quiet fixtures have identical encoded request cues, so the model cannot distinguish their labels from request cues alone. Live behavioral differences may still change scores. An unwarned confirmation increases confirmed coached misses; lead stays null. This is a functional execution with a detection miss, not a successful scam-protection case.

### MT04 — warning before confirmation, rule origin

1. Apply MT04. Transfer → agree if needed. Observe the recipient-step warning before typing.
2. Type dummy account → Next → 5, 0. Wait for at least one scored prefix and note whether AI also contributes.
3. Press Review → **I want to review it myself** → wait until the 15-second pause ends → **Continue with transfer** → Done.
4. Record first displayed warning, review entry, confirmation, and origin.

Expected: call plus new recipient triggers the demonstration rule independently of AI. Confirmation is disabled during the pause. Observed lead = confirmation minus warning and includes the pause/user delays. Before-review interval is a different measurement, not unbiased prediction lead.

### MT05 — legitimate interruption remains counted after cancellation

1. Apply MT05: the fictional payment is legitimate, despite matching the call/new-recipient rule.
2. Transfer → observe warning at recipient → type dummy account → wait for a scored prefix → Cancel.
3. Inspect the last session and FIR counters.

Expected: outcome cancelled, label Normal, warning retained. Legitimate denominator and false-intervention numerator each increase by one. Do not relabel this as coached to improve the report. A positive warning is not automatically a correct prediction.

### MT06 — guidance for difficulty

1. Apply MT06. Transfer → Deliver authored request → Next → 5, 0.
2. Go back to recipient and press Next again. Inspect the step-by-step guidance; check the amount and re-enter 50 if needed.
3. Wait for a scored prefix → Review → confirm after any required pause → Done.

Expected: the preset's mock repeated navigation triggers Simple mode guidance. Guidance by itself does not count as a false intervention. If AI adds a warning, record it as legitimate interruption burden. Do not treat Struggling as scam ground truth.

### MT07 — multiple app switches in one transaction

1. Apply MT07. Transfer → Aina → Deliver authored request.
2. Press **Simulate app switch**; wait approximately 3 seconds; press **Return to bank app**.
3. Repeat: Simulate app switch → approximately 4 seconds → Return to bank app.
4. Inspect App switch in the Guardian read-out: returned state and approximately 7 seconds total away, allowing for manual timing. Then Next → 5, 0 → scored prefix → Review → confirm after any required pause → Done.

Expected: both visits accumulate rather than replace the first duration. A first warning must not be credited as visibly displayed while the bank is covered. This tests a mock interaction, not native cross-app detection or knowledge of which app was opened. Screenshot the state/duration: **Download metrics JSON does not contain the full call/switch event timeline.**

### MT08 — call status changes

1. Apply MT08. Transfer → Aina. Leave request unavailable.
2. Start simulated call → wait approximately 3 seconds → End simulated call.
3. Start simulated call again → approximately 2 seconds → End simulated call. Capture active and ended UI states.
4. Next → 5, 0 → scored prefix → Review → confirm after any required pause → Done.

Expected: call status toggles correctly and finishes off. The current transaction rule requires a new recipient as well, so a call to a saved recipient alone must not be credited as a rule detection. Any AI warning is observed separately. Full call transition timestamps are not exposed by the measurement download; this case does not certify exported phone-call telemetry.

### MT09 — request unavailable

1. Apply MT09. Transfer → New recipient → type dummy account. Do not press Deliver authored request; it is unavailable.
2. Next → 5, 0 → wait for a scored prefix → Review → confirm after any required pause → Done.
3. Record model availability, score, threshold and whether any warning appeared.

Expected: scoring can use the frozen no-request behavior head; missing context is not assumed safe. Neither call nor suspicious request evidence is supplied here, so a coached miss is possible. Record it honestly. Successful scoring and successful detection are separate outcomes.

### MT10 — boundary of the untested amount rule

1. Apply MT10. Transfer → type dummy account → Next. Keypad **1, 5, 0** gives RM 150, exactly 3× the fixed usual amount.
2. Inspect policy: call + new recipient already warrants a pause, but exactly 3× must not trigger the stronger **amount exceeds 3×** rule.
3. Use the keypad backspace icon (**Delete**) once, then press **1**, changing 150 → 151. Inspect the stronger amount reason and high rule response.
4. Wait for a scored prefix → Review → I want to review it myself → wait for pause completion → Continue with transfer → Done.

Expected: amount high-rule boundary is strictly greater than RM 150, not greater-than-or-equal. An AI warning can contribute separately. Both values may still be warned by the medium rule, so this tests rule strength/reason, not warning versus no warning. Threshold is an **untested demonstration default**, not a validated risk cutoff. Family preview stays off.

## Save and interpret the results

After each case, download **Download metrics JSON** from Warning measurements. Android's corresponding control is **Copy metrics JSON**. Record the last session ID before starting another case. The integrated app retains at most 20 ended sessions in this app run and does not automatically write them to disk; reload/new tab can discard the report. Keep exports locally. If you want a later audit, provide the saved file or its local path.

| Case | Session ID | Outcome | AI score / threshold / cutoff | Warning origin and stage | Observed lead / before-review interval | Software check | Detection outcome | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MT01 | | | | | | Not executed | Not executed | |
| MT02 | | | | | | Not executed | Not executed | |
| MT03 | | | | | | Not executed | Not executed | |
| MT04 | | | | | | Not executed | Not executed | |
| MT05 | | | | | | Not executed | Not executed | |
| MT06 | | | | | | Not executed | Not executed | |
| MT07 | | | | | | Not executed | Not executed | |
| MT08 | | | | | | Not executed | Not executed | |
| MT09 | | | | | | Not executed | Not executed | |
| MT10 | | | | | | Not executed | Not executed | |

- **Software status:** pass, fail, blocked or not executed, against the stated behavior/accounting. A legitimate warning can be correctly counted while showing poor detection usefulness.
- **Detection outcome:** coached with warning = TP; coached without warning = FN; legitimate with warning = FP; legitimate without warning = TN. This is the combined warning policy. The export's origin helps attribute warnings; it is not a complete standalone AI prediction report.
- **Recall:** coached warned / all annotated coached confirmed or cancelled sessions. Include misses and report timing separately; a warning only at review is different from a recipient-step warning.
- **FIR:** legitimate confirmed/cancelled sessions with any displayed warning / all legitimate confirmed/cancelled sessions. Each session counts at most once. For exactly these ten completed cases there are five legitimate and five coached sessions; deviations/abandonment change denominators.
- **Lead:** confirmation minus first warning only when both exist. Report sample count and missed/cancelled sessions beside it. No warning/no confirmation means null, not zero. The 15-second pause can inflate observed lead.
- **Privacy:** exported measurements must not contain dummy account `123412341234`, recipient names, message text, call audio or caller identity. Account remains in UI memory. Request text is a bundled fixture; the measurement export excludes it.
- **No inference-latency claim:** the five-second prefix wait is scheduling and interaction time, not measured inference latency. This manual does not replace independent unseen-scenario evaluation or physical-device testing.

These ten related authored cases are a functional/manual challenge, not an unbiased accuracy benchmark. Do not pool them with earlier offline denominators or tune on them and call that independent improvement.

## Three-minute presentation after rehearsal

Use a fresh tab after saving the full manual report. Run MT01 → MT02 → MT03 with the exact fields above. The complete ten-case check is not a three-minute activity.

1. **0:00–0:20:** introduce the payer and the decision to verify before confirmation; state that all data and payments are simulated.
2. **0:20–0:55:** MT01, legitimate reference. Keep any unexpected warning visible and counted.
3. **0:55–1:55:** MT02, show an actual AI-origin warning at recipient, its plain reason/priority, the independent-check guide and cancellation. Do not activate call rules to manufacture AI success.
4. **1:55–2:25:** MT03, show the quiet-scam limitation. A visually ordinary payment may still be unsafe.
5. **2:25–3:00:** show measured counters/timestamps and the full saved evidence. Explain that cancellation has no confirmation lead, live pause inflates confirmation lead, and no-warning is not a safety guarantee.

If MT02 does not warn in the allocated window, report the live miss and show prior recorded evidence as a recorded run. Rehearse with a stopwatch. This sequence demonstrates execution and a decision opportunity; human decision improvement and reliable field protection remain unproven.

## Local preview recovery

The existing exported app can be served from `D:\Projects\tools\projects\scam-guardian\scam-guardian` using `node scripts/preview.mjs dist 4173`. This uses its existing project-root script and dependencies; no package installation is needed. If port 4173 is already serving the app, reuse it. A preview is not a public production deployment.
