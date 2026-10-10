# Four-minute Scam Guardian presentation

Audience: Predictive Model Track judges. This is a working simulation prototype, not a claim of field protection. Personalization is skipped. Use the current `/demo` app and `/evidence`; the older testing website on port 8084 is a separate artifact.

## Before entering the stage

- On Vercel, open `/demo` and `/evidence` on the deployment's own HTTPS origin. For a local preview, serve the exported app with `node scripts/preview.mjs dist 4173` and open `http://127.0.0.1:4173/demo` and `http://127.0.0.1:4173/evidence`. For live counters navigate within the demo using **Pitch evidence**, rather than the separate tab; different tabs have different app-run memory.
- Use a desktop window about 1440 × 1000 or larger. Close unrelated tabs and enable the presentation display before rehearsal. Test the real venue screen; this is not a physical Android validation.
- Reset once before the presentation; do not reload between cases. Reset restores controls but intentionally retains prior ended measurement sessions in this app run. Start a fresh tab if you need a new empty measurement report, and export older records first.
- Scroll the Guardian panel to find controls beforehand. Its independent scrollbar is intentional. Locate Authored request, Evaluation label, Decision support and Warning measurements.
- Call off, app switching returned, family preview off. Use dummy account `123412341234` and RM 50 only. Labels are operator annotations, not predictions. Do not use the Coached preset for the AI-contribution case: that would activate transaction rules.
- Have the evidence tab and screenshots ready as fallback. The guide below is about 360 spoken words; allow the remaining time for clicks, five-second model prefixes and short pauses. Rehearse with a stopwatch; automated functional checks are not proof of your speaking speed.

## Timeline, words and exact actions

### 0:00–0:30 · Problem clarity and value

Say:

> “A payment can look ordinary while the instructions behind it are dangerous. Our user is someone making a mobile transfer while following a caller or message. Scam Guardian helps them decide whether to verify independently before confirming. Our goal is an earlier opportunity to check, with fewer unnecessary interruptions. Everything you will see is simulated; no money moves.”

Show the bank app home. Keep the model/evidence explanation short; no market-loss statistics or invented savings.

### 0:30–1:10 · Predictive pipeline and benign contrast

Case A fields, all explicit:

| Field/control | Selection |
| --- | --- |
| Demo preset | Normal |
| Evaluation label | Normal |
| Authored request | Routine rent request |
| Recipient | Aina, saved |
| Amount | RM 50 |
| Account entry | Not applicable for saved recipient |
| Simulated call | Off |
| External app switch | Returned / in bank app |
| Family preview | Off |
| Guardian consent | Agree and turn on, if requested |

Actions: **Transfer → Agree and turn on** if asked → **Deliver authored request → Next → 5 → 0**. Wait for a scored five-second prefix. **Review → Confirm transfer → Done**. If a warning appears, report it; never overwrite the label to hide it.

Say:

> “The app collects timestamped interaction counters during an opted-in transfer. Request text here is an authored fixture, encoded into numeric cues. A frozen XGBoost model runs without request context; logistic regression uses behavior and request cues once they arrive. This routine example completed without a review. No warning is a model result, not proof that a payment is safe.”

Use the last sentence only if the observed outcome is actually unwarned.

### 1:10–2:10 · AI contribution and decision support

Case B fields, all explicit:

| Field/control | Selection |
| --- | --- |
| Demo preset | Normal, again; never Coached for this case |
| Evaluation label | Coached-high |
| Authored request | Coached request with warning bypass |
| Recipient | New recipient |
| Account | Dummy `123412341234`, typed |
| Amount | RM 50 |
| Simulated call | Off |
| External app switch | Returned / in bank app |
| Family preview | Off |
| Guardian | On |

Actions: select the fields that are available before starting → **Transfer → New recipient → Deliver authored request**. Stay at recipient until actual AI review appears; normally the next five-second prefix plus timer response. Show the banner and **AI** origin. Type the dummy account → **Next → 5 → 0 → Review → Open independent-check guide → Cancel this transfer**.

Say:

> “Now the instructions claim bank authority and tell the person to ignore warnings and avoid checking. The simulated call is off, the amount is ordinary, and the transaction rules stay quiet. The AI recommends review while we are still choosing the recipient. The display policy categorizes the issue as warning bypass and prioritizes a check before confirmation. The guide tells the user to use a contact number they already know. I cancel to check independently.”

Purpose: Detect / Categorize / Prioritize / Explain. This cancellation is your scripted demonstration, not a measured improvement in another person's decision.

### 2:10–2:45 · Explainability and trust

Scroll the Guardian panel to **Decision support → Why the first AI review fired**. Point at actual contributions and the reconstructed logit. Do not read the arithmetic aloud or call the score a percentage.

Say:

> “The explanation comes from the actual first positive logistic-regression calculation. Positive contributions push toward review, and all terms reconstruct the score. The category and priority are disclosed policies. Inference runs locally; raw account details, call audio and cross-app messages do not enter the model. Personalization is deferred.”

If this session used XGB, say its numeric score is available but tree attribution is not implemented; never invent an LR explanation.

### 2:45–3:40 · Predictive rigor and measurable limits

Open **Pitch evidence → Model evidence**. Show both evaluations, then **Live proof**. Pre-scroll the separate fallback tab if necessary, but do not expect that tab to share live counters.

Say:

> “The original simulated test detected 647 of 720 coached sessions, with two reviews among 720 benign sessions. Quiet scams were zero of sixty. Our new 32-session challenge was harder: AI detected six of sixteen, and a simple cue baseline did better. We keep these failures visible. The live app also counts every displayed legitimate warning and records warning timing. Its confirmation interval includes the cooldown; the before-review interval does not.”

The challenge has 16 authored case definitions and two correlated profiles, not 32 independent people. Original synthetic profile holdout repeats wording banks. Both are simulation evidence. The simple cue comparator was hand-set and is unvalidated; AI superiority is not established. Never combine challenge and original denominators.

The cancellation has no confirmation lead. Show its warning-before-review interval; use the separate authored shadow-time report only with its simulation label. Earlier observed 18.895 seconds included the forced pause and must not be presented as prediction speed.

### 3:40–4:00 · Live execution and conclusion

Say:

> “We have demonstrated a locally running prediction, an explanation, an actionable check and auditable timing and interruption counts. The prototype works in selected simulated cases. Independent user testing and stronger unseen-language evaluation are the next requirements before protection claims.”

Stop at four minutes. Do not add an unplanned fourth case or argue that software test passes prove model accuracy.

## If something differs on stage

| Observation | Response |
| --- | --- |
| Routine payment is warned | Keep Normal annotation, cancel or finish as appropriate, show burden counter, say this is a false review in the authored scenario. |
| AI has not returned | Wait for the next prefix. If unavailable, state that explicitly; show the recorded acceptance evidence as a recorded run, not a live detection. |
| No warning within the allocated minute | Do not force the Coached preset and credit the result to AI. Move to the evidence page and report the live miss. |
| Panel is below the visible area | Scroll inside Guardian; the bank warning remains in the fixed footer. On narrow web use the Guardian tab. |
| Venue network fails | The scorer is bundled locally. Use the prepared local preview. Do not claim the Expo development server is a production deployment. |
| Browser fails | Show the captured browser acceptance images and disclose that they are recorded evidence. |

## Concise answers for judges

- **What is learned?** Real frozen LR/XGBoost weights. English request cue extraction and intervention categories are handcrafted. The trained output is binary review.
- **Does AI beat rules?** In one live authored case it reviews while transaction rules do not. On the new challenge it does not beat the simple request-cue baseline. We cannot claim general superiority.
- **Why not an LLM?** This small numeric scorer already runs locally. We have not demonstrated that another architecture fixes the missing-evidence problem.
- **What does 89.86% mean?** Recall on 720 authored coached test sessions from the original generator, not real-world scam accuracy; all 60 quiet cases were missed.
- **Can a legitimate warning be useful?** Yes, verification can be prudent. It still counts as a legitimate interruption in our burden metric.
- **Can the model observe WhatsApp or calls?** No. Those controls are explicitly simulated. No caller, audio or external message capture is implemented.
- **What is early warning?** A warning shown before confirmation, with separate warning-to-review and actual-confirmation intervals. Authored shadow replay excludes the live pause but is not real victim behavior.
- **Have you proved better decisions?** No. The app provides that decision opportunity. A consented comparison pilot is prepared but not executed.
- **What is the business value?** A chance to independently verify before a loss. Deployment value must subtract intervention burden and operational cost; avoided losses are unmeasured.

## Hypothetical value calculation for Q&A only

Do not claim a market saving. A planning formula is `net benefit = independently verified avoided losses − interruption cost − operating cost`. Both prevented-loss frequency and verification effectiveness are unknown here. Amount at risk alone is not a measured benefit. The live demo proves the decision opportunity and records burden, not the first term of that formula.

## Five-criterion coverage

| Criterion | What to point at | Remaining evidence gap |
| --- | --- | --- |
| Problem clarity/value | Mobile payer, pre-confirmation decision, verification opportunity and burden tradeoff | Financial benefits unmeasured |
| Predictive rigor/data robustness | Frozen pipeline, original evaluation + new challenge, stronger baseline, missing/noisy/quiet cases | AI superiority, broad robustness and field effectiveness unproven |
| Decision support/actionability | Category, priority, specific independent-check guide and Cancel | Human decision improvement unmeasured |
| Explainability/trust | Actual LR first-positive contributions, origin, privacy boundary | XGB attribution and comprehension pilot pending |
| Live prototype/pitch | Real app flow, content-free export, timed guide, replayable acceptance | Venue rehearsal and physical Android release check pending |

This guide strengthens a defensible presentation. It does not certify top-band judging scores.
