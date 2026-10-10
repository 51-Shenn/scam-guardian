# Frozen model diagnosis — executed 10 October 2026

Protocol: [frozen-model-diagnosis-plan.md](frozen-model-diagnosis-plan.md). Evidence: [full deterministic report](../data/processed/frozen-model-diagnosis-v1/report.json). No weights, thresholds, encoders or deployed policies changed. This is diagnosis of inspected development cases, not another fresh-test result.

## Exact reproduction and controls

All 224 primary prefixes reproduce the archived model head, score, threshold and review decision exactly. Every available LR explanation reconstructs its score within 1e-12. Independent second execution with `--verify` matches the first report byte for byte. Archived source hashes and original report bytes remain intact.

| Comparator | TP / FN / FP / TN | Recall | F1 | Benign interventions |
| --- | --- | --- | --- | --- |
| Frozen routed AI | 6 / 10 / 2 / 14 | 37.5% | .500 | 2/16 = 12.5% |
| Frozen XGB behavior-only control | 0 / 16 / 0 / 16 | 0% | .000 | 0/16 |
| Existing cue-only baseline | 8 / 8 / 2 / 14 | 50% | .615 | 2/16 = 12.5% |
| Transaction rules | 2 / 14 / 2 / 14 | 12.5% | .200 | 2/16 = 12.5% |
| Existing rules OR AI | 8 / 8 / 4 / 12 | 50% | .571 | 4/16 = 25% |

Behavior-only uses the already selected fallback head and threshold, with request availability removed but behavior held identical. It is not a newly fitted model or causal ablation of LR. The challenge reused the same direct/hesitant behavior for every label. It therefore supplies no distinguishing behavioral ground truth; 0/16 here does **not** establish that behavior is intrinsically useless.

## Every missed scam retained

| Bucket | IDs | Count | Finding |
| --- | --- | --- | --- |
| Recognized cues below threshold | C04-direct, C10-direct | 2 | Authority/safe-account or account-mismatch cues exist, but combined scores peak at .9129 and .5356, below .9524. Both corresponding hesitant profiles trigger at 20 seconds. |
| Unrecognized wording | C06-direct, C06-hesitant | 2 | “Disregard any caution screen” and “without seeking another opinion” miss the English regex cues. |
| Quiet identical | C08-direct, C08-hesitant | 2 | Exact model-input equality with legitimate C07 confirmed. |
| Request absent and identical | C12-direct, C12-hesitant, C14-direct, C14-hesitant | 4 | Exact model-input equality with legitimate C11/C13 confirmed. Simulated call state is outside the trained head. |

Six missed sessions have model inputs identical to legitimate twins. These are input-identifiability limits, not evidence that another optimizer can discover hidden intent. Retain them in aggregate results. Availability or an active call is context for a check, not proof of a scam; both call-lookalike twins are warned by the transaction rule.

## Request dependence and behavioral suppression

Request features account for **65.7% of summed absolute standardized coefficients**, and **59.6% of absolute transformed contribution mass** across request-available LR prefixes. The remaining mass includes behavior, delta and stage. These descriptive sums exclude the intercept; repeated prefixes are correlated. They are not causal percentages, feature accuracy or proof that the model is merely regex copied unchanged.

At each recognized-cue miss's peak, recipient interval sample count contributes approximately **−4.15 logit units** and recipient edit count **−2.08**. In C04-direct, safe-account wording contributes +6.08 and avoid-verification +4.83. In C10-direct, avoid-verification contributes +4.83 and account mismatch +3.13. The intercept is −4.74; every other term remains in the JSON.

Thus behavior materially affects the combined LR decision, but the challenge does not demonstrate useful behavioral discrimination. It can suppress recognized warnings for a quick/direct journey. Whether that tradeoff reduces legitimate interruptions appropriately needs independently authored legitimate and scam behaviors, not tuning these two examples.

## Small-sample and paired comparison

Under an **independent Bernoulli assumption**, 95% Wilson intervals are:

- AI recall 6/16: **18.5–61.4%**.
- Cue baseline recall 8/16: **28.0–72.0%**.
- Each comparator's false-intervention rate 2/16: **3.5–36.0%**.

That assumption is violated: 16 case definitions are replayed with two correlated profiles, sharing eight authored families. These intervals illustrate sample uncertainty; they are **not confidence bounds on true human/population recall**. Interval overlap alone is not a paired test. See [NIST's Wilson method](https://itl.nist.gov/div898/handbook/prc/section2/prc241.htm) and [paired comparison documentation](https://www.statsmodels.org/dev/generated/statsmodels.stats.contingency_tables.mcnemar.html).

On these exact paired observations, both AI and cue baseline are correct on 20 sessions, baseline alone on 2, AI alone on 0, and both incorrect on 10. Both have the same benign false warnings. This is a descriptive baseline advantage on this set, not established population superiority. Profile-specific AI recall is 2/8 direct and 4/8 hesitant; the cue baseline is 4/8 in each. No inferential p-value is claimed for this clustered authored sample.

## Decision and next evidence

Keep the model frozen. Do not silently substitute the cue baseline or adjust thresholds against these inspected cases. Use the [fresh-test authoring protocol and blank template](fresh-test-authoring.md), then a separate development/training collection if a model change is warranted. No fresh items, human decision pilot, multilingual robustness or on-device latency result exists from this diagnosis.

## Software checks for this diagnostic increment

Lint and TypeScript pass; all 78 existing domain tests pass. Android Hermes and static web exports succeed. The 40-slot CSV has 24 consistent columns, unique IDs and blank collection fields. Diagnosis rerun matches bytes exactly. No app presentation changed; browser/user/device testing was not rerun or claimed for this increment. These checks verify the analysis tooling and unchanged build, not model effectiveness.

Reproduce from the app root:

```powershell
node scripts/diagnose_frozen_model.mjs
node scripts/diagnose_frozen_model.mjs --verify
```
