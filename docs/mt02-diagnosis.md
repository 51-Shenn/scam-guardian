# MT02 delivery diagnosis

10 October 2026. User reported no visible response in MT02. Their live session inputs and scores have not been supplied, so its cause is not established.

The frozen scorer was probed with the account empty, new recipient selected and call off. Coached and routine fixtures were each delivered after 1, 4, 6, 15, 60 and 120 seconds, with and without account focus. Predictions ran on the existing five-second grid for 15 seconds after delivery. All 12 coached configurations recommended review; none of the 12 routine configurations did. These are authored diagnostic inputs, not participant results, held-out recall or proof of generalization. No model weights or thresholds changed.

Reproduce with `node scripts/diagnose_mt02_timing.mjs`. Numeric results are in `data/processed/mt02-timing-diagnostic.json`.

The UI now names the selected request beside the score and exposes a **Prepare MT02 · AI warning test** setup button while at Home. It sets the Normal preset, call off, app switch returned, Coached-high annotation and coached request selection. Consent, request delivery and actual model inference remain separate actions. It never sets a positive AI answer. The score and threshold use four decimals to reduce rounding ambiguity. Delivery does not itself mean an alert.

For an unresolved live failure, capture selected request, delivery status, model ID, scored cutoff, score and threshold before cancelling. A negative LR answer is a model miss; behavior-only scoring can mean that prefix preceded delivery; Waiting/Unavailable are distinct failures. The metrics export does not retain that detailed diagnostic context. See [manual](manual-tests.md).

After reconciling the teammate's latest main UI, the isolated Edge run `run-1791647218227` passed all 20 acceptance checks. The setup button selected coached request and call off; actual inference displayed an AI-origin recipient-step warning with an empty account. The guide/cancel flow retained a null confirmation lead. A separate confirmed authored case measured 19.977 seconds warning-to-confirmation and 2.250 seconds warning-to-review, including the enforced pause and automation timing. The deliberate legitimate warning fixture still counted in FIR (1/2). These are software acceptance observations, not new accuracy estimates or the user's live session. Lint, type checking, all 79 domain tests, Android/web exports and the Vercel static build check passed. No physical Android or actual Vercel deployment was tested.
