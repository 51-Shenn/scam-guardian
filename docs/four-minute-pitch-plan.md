# Four-minute Predictive Model Track delivery plan

Status: authorized implementation, 10 October 2026. Personalization is deferred. The frozen model, encoder and thresholds are unchanged. The supplied judging images define the five criteria and Detect / Categorize / Prioritize / Explain expectations.

## Requirements and acceptance

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| PITCH-01 | Identify a mobile payment user and the decision before confirmation. | Presenter guide and evidence screen state user, decision and bounded value; no invented loss-prevention results. |
| PITCH-02 | Separate learned review from transaction rules and expose model weaknesses. | Frozen rules-only / AI-only / hybrid / simple request-cue comparisons, all cases retained, per-family supports, source hashes, missing/noisy/paraphrased/quiet controls. |
| PITCH-03 | Categorize and prioritize an intervention with a concrete next action. | Shared Android/web decision summary labels policy categories/priorities, distinguishes guidance from review, offers an independent-check guide and cancellation. |
| PITCH-04 | Explain the actual LR computation without treating scores as probabilities. | All feature and missing-indicator contributions reconstruct the exact logit/score; first-positive evidence retained when later prefixes change. XGB fallback is explicitly not an attribution explanation. |
| PITCH-05 | Provide a four-minute presentation and rehearse the working web flow. | Exact operator fields/actions, approximately 400 spoken words with interaction allowance, two live contrast cases and an honest counterexample/evidence page, desktop/narrow browser checks and Android/web exports. |
| PITCH-06 | Preserve timing/FIR meaning and privacy. | Existing content-free measurement export, no scenario labels in inference, no forced-delay inflation of predictive lead, all displayed legitimate warnings counted. |

## Frozen supplemental evaluation protocol (written before execution)

This is an authored challenge set, not new participant data, a newly held-out fraud dataset, or a production benchmark. Sixteen predeclared request/context cases are evaluated under two fixed interaction profiles (direct and hesitant): 32 correlated sessions. The same simulator-generated events go through the app feature adapter and unchanged frozen scorer. Both profiles remain in the result even when they perform poorly.

Cases cover explicit bypass, unusual wording, quiet identical pairs, genuine account changes, legitimate/coached simulated calls, request absence and negated/quoted instructions. Additional availability variants mask editing and paste on the same cases; results remain separate from the primary 32-session comparison. No weights, thresholds or regex features may be adjusted after seeing this report.

Comparators: existing transaction rules; frozen EXP013 AI availability policy; their OR hybrid; an explicitly hand-set request-cue baseline. The last is a diagnostic comparator, not a validated production policy. Report confusion counts, recall, precision/F1, legitimate session warning rate, per-family outcomes and authored shadow warning lead. Five-second prefix decision times and reference confirmation times are authored; they are not displayed-warning timings or device latency. Do not combine these metrics with current live measurement counters.

The historical EXP013 test (1,440 simulated sessions) is displayed separately with provenance, including 0/60 quiet-scam detection. Its fresh profile IDs do not establish unseen-author or unseen-language generalization. The small new challenge set does not repair that limitation.

## Delivery order

1. Faithful numeric explanation and policy decision summary.
2. Independent-check guide in the mock payment flow.
3. Execute and publish the frozen challenge comparison, preserving failures.
4. Cross-platform evidence page and timed presenter guide with Q&A and fallback.
5. Domain tests, lint/type checks, both exports and real browser rehearsal checks; record results, update memory and commit locally.

Human decision improvement, consented participant comprehension, physical Android release latency and field effectiveness cannot be completed by scripted browser tests. Prepare a pilot record template; leave those claims unmeasured.
