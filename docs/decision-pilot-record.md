# Exploratory decision and explanation pilot

Status: **not executed**. Five to ten consented adult volunteers may reveal usability problems; this small role-play cannot establish real-world protection, model accuracy or personalization improvement. No real payments or personal banking details. Participation is optional and can stop at any time.

Use anonymous local participant keys. Tell participants requests and balances are simulated and that their decisions are being observed. Keep notes content-free; record no names, phone numbers or account details. Do not upload results. Save any structured pilot records under `data/processed/decision-pilot/`.

Each participant completes matched legitimate and coached scenarios with and without assistance, in counterbalanced order. Use different but comparable request variants to reduce simple repetition. Freeze scenario labels before sessions. Do not quietly exclude participants who proceed despite warnings. Explain that the researcher can end a simulation at any time.

| Field | What to record |
| --- | --- |
| Anonymous participant key | Local opaque ID |
| Scenario ID / declared label | Authored role-play ground truth, not inferred label |
| Assisted / comparison | Whether Guardian was enabled |
| Presentation order | First/second and counterbalance group |
| Warning shown | Yes/no + displayed-warning timestamp if available |
| Final action | Continue / cancel / independently check / unfinished |
| Explanation comprehension | Participant can describe the actual reason, yes/no |
| Next-action comprehension | Participant can describe use of a previously known contact, yes/no |
| Verification simulated or actually performed | Distinguish opening guidance from performing a check |
| Legitimate warning | Count every unnecessary displayed interruption, including cancellation |
| Task time / friction | Observed time and brief content-free confusion note |
| Consent / withdrawal | Obtained / withdrawn; retain data only within agreed consent |

Report raw counts by condition, exceptions, order effects and ranges. A proposed usability target is at least 80% understanding reason and next action without coaching; this is a development target, not an observed result or statistical proof. Do not infer avoided loss from a cancellation alone. Model warning correctness and user response effectiveness are separate outcomes.
