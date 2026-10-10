# Fresh independent test — authoring template, not executed

Purpose: evaluate the frozen model on genuinely new mock requests and, separately, distinguishable observed/role-play behavior. Start with 30–40 independently authored items to expose defects; do not treat this small convenience sample as a reliable real-world effectiveness estimate. More sessions alone do not fix shared-author, wording-family or participant dependence.

The [blank CSV](fresh-test-template.csv) contains 40 empty slots. It contains **no examples or labels** and must never be counted as collected data. Use dummy facts only; no real messages, names, accounts, caller identity, clipboard contents or call audio. Save completed local collection files under project `data/raw/fresh-test-v1/`; derived predictions/evaluation belong under `data/processed/fresh-test-v1/`.

## Author before viewing predictions

1. Ask teammates other than the original training-pattern author to write the items. Do not show them model cue patterns or prediction results while authoring. Use anonymous author IDs; record human/LLM provenance honestly. Do not use LLM paraphrases for the independent human-authored test.
2. Aim for roughly equal legitimate and coached items, including normal struggle, legitimate new recipients, genuine verified account changes, quoted anti-fraud advice, unverified changes, unfamiliar pressure, and quiet identical twins. Include Malay, Chinese, Manglish, typos and negation. Report each language/category, even when none are caught.
3. Give every original wording family a stable ID; keep all paraphrases/twins together. A pair ID marks legitimate/scam lookalikes. Human label reasoning describes authored hidden intent and observable evidence independently of what the model should predict. The label is not a model input.
4. Have another person review labels before scoring. Disagreements stay visible as unresolved and cannot enter primary metrics until resolved without model outputs. Expected actions are human annotations, not guarantees or inference inputs.
5. Freeze completed data, labels, source/encoder/model hashes, thresholds and evaluation plan before running. Record row counts, author/family distribution and collection method. Preserve the freeze manifest and exact original bytes. Run once; keep every output and failure. Inspecting results turns this set into development evidence for any later model changes.
6. Compare selected AI, behavior-only head, cue-only baseline, transaction rules and explicitly named combinations on the same prefixes. A proposed cue-OR-AI comparison must be declared before execution; do not switch the deployed policy based on this test. Record FIR, timely recall, F1, per-category counts, warnings before onset, misses and authored shadow lead separately from actual displayed-warning timing.

## Fields to fill

| CSV field | Allowed content / meaning |
| --- | --- |
| `case_id` | Unique F001–F040; unused slots are excluded and counted explicitly. |
| `author_id` | Anonymous A01 etc.; never a person's name. |
| `wording_family_id` | Common source/semantic family for all paraphrases; group-level split key. |
| `pair_id` | Shared ID for lookalike twins, or blank when unpaired. |
| `language` | `en`, `ms`, `zh`, `manglish`, or an explicitly described mixed language. |
| `label` | `legitimate`, `coached_medium`, or `coached_high`; selected before scoring. |
| `request_available` | `true`/`false`; unavailable text is blank, not an empty “available” request. |
| `request_text` | New human-authored dummy payment request. Quote CSV text containing commas/newlines/quotes correctly. |
| `approved_details_available` | `true`/`false`; unknown prior details must stay unknown. |
| `account_details_changed` | `true`/`false`, or blank when approved details are unavailable. This is mock record state, not inferred from the label. |
| `mock_known_channel_verified` | `true`/`false`; a simulated receipt bound to proposed details. Never a claim that a real person was contacted. |
| `mock_call_active` | `true`/`false`; simulated context for rules, not evidence of a real device capability or a selected learned feature. |
| `mock_new_recipient` | `true`/`false`; transaction-rule state. |
| `mock_amount_ratio` | Nonnegative numeric ratio to mock usual amount; no real financial amount. |
| `behavior_source` | `fixed_authored_timeline` or `consented_role_play`; do not call scripted timing observed behavior. |
| `behavior_profile_id` | Named frozen authored profile, or a content-free role-play session reference. |
| `behavior_event_file` | Relative path to local timestamped telemetry, or blank for not yet collected. |
| `coaching_onset_ms` | Nonnegative annotated time when coaching begins; blank for legitimate/unavailable timing. Labels/onset never enter inference. |
| `reference_confirmation_ms` | Frozen uninterrupted authored reference time for shadow lead; blank when unavailable. Do not invent a confirmation for cancellation. |
| `label_reason` | Author's explanation of legitimate/scam intent. Separate facts known to the author from model-observable cues. |
| `observable_cue` | What the numeric contract actually exposes, or `none`; do not manufacture a cue for quiet scams. |
| `expected_action` | `continue`, `offer_guidance`, `verify_independently`, or `cancel`; an independent human expectation. Legitimate precautionary warnings still count as intervention burden. |
| `provenance` | `human_independent`, `human_training_author`, or `llm_generated`; only independently human-authored items enter the proposed primary fresh test. |
| `review_status` | `pending`, `agreed`, `unresolved`; only agreed fully specified items enter primary evaluation. |

An unrecognized language must not be translated or replaced in the test after viewing failures. If a translation/encoder update is developed, use separate training and validation items and another untouched test.

## Wording and behavior are separate experiments

Using the same frozen direct/hesitant timelines for every item is acceptable for an **encoder/request challenge**. It cannot establish whether real coached behavior differs from legitimate behavior. For a behavior evaluation, collect consented role-play telemetry with participant/session/condition grouping, matched legitimate difficulty cases and multiple natural journeys. Avoid assigning “all scams backtrack” and “all legitimate users are fast,” which encodes labels artificially.

Native calls, remote-access state, motion and cross-app activity remain simulated here. Calls can be benign and a new recipient can be legitimate. Selected trained heads do not automatically learn these new fields because the CSV includes them; explicit feature changes require a new training experiment and validation.

## Evaluation readiness and success rules

- No fresh test has run. CSV preparation is not an experiment result, and no automated importer for this template has been added in this increment.
- Agree on the operating false-intervention budget **before selecting a model on validation data**; the frozen historical target is 5%, not an achieved target on this challenge. Do not choose a new threshold on the fresh test.
- Report raw counts and paired discordances. Give Wilson intervals only with their sampling assumptions; cluster-aware analysis is needed for repeated authors, families or participants. Roughly 100 independent examples per class give about ±10 percentage points near a 50% rate, not a guarantee for clustered convenience samples.
- Keep every hard category in aggregate results; separately report the observable-cue subset to clarify scope, not replace the aggregate with it.
- A 30–40-item wording test can reveal failure modes. It cannot prove financial benefit, real victim behavior, warning compliance, population protection or personalization.

For the pitch: “Our challenge exposed encoder misses, identical-input limits and a behavior-dependent suppression of recognized warnings. We froze the model, kept all failures and prepared an independently authored test. Broad robustness and better human decisions remain unproven.”
