# Frozen model diagnosis protocol — 10 October 2026

Scope: inspect the already reviewed 32 primary authored challenge sessions. They are now development evidence for future decisions, not a fresh test. Preserve the original report and historical designation at execution. Do not fit, tune thresholds, change the encoder, remove failures or deploy an alternative policy.

Before execution, add a root `scripts/diagnose_frozen_model.mjs` that:

1. Verifies every original recorded source/model hash and reconstructs every primary prefix with exact score/head/decision equality to the archived report.
2. Runs the existing selected policy and the already selected XGB behavior-only head on identical behavior timelines. The control removes request availability only; it uses the head's frozen threshold. This is a routed-head control, not a causal estimate of behavior's contribution to LR.
3. Retains original cue-only, transaction-rule and hybrid results. Reports paired successes/failures, profile-specific results and descriptive 95% Wilson intervals. Repeated timing profiles and shared families violate independent-sample assumptions: intervals are illustrative, not population confidence bounds. Overlapping intervals alone are not a paired significance test.
4. Lists every missed scam, available numeric cues, peak score, threshold and exact LR terms. Classifies misses using authored input inspection, with explanations distinguished from proven causes.
5. Reports absolute transformed contribution mass and standardized coefficient mass by request/behavior/delta/stage. Coefficient magnitude alone is not attribution or evidence of causal benefit. Intercept is reported separately; no XGB attribution is invented.
6. Confirms input identity for quiet, call-lookalike and unavailable-request positive/negative pairs. Records absent or unlearned information rather than claiming new recipients/calls establish fraud.
7. Saves deterministic outputs strictly under `data/processed/frozen-model-diagnosis-v1`, with script/runtime/source hashes and independent byte-identical rerun verification.

No new dependency, app/UI feature, training experiment, personalization or publishing is in scope. Fresh-test collection stays pending human authors; blank templates are not data.

Statistical references: [NIST Wilson intervals](https://itl.nist.gov/div898/handbook/prc/section2/prc241.htm), [paired McNemar test](https://www.statsmodels.org/dev/generated/statsmodels.stats.contingency_tables.mcnemar.html). Paired discordance counts will be descriptive here; no population significance claim is appropriate for this authored clustered set.
