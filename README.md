<p align="center">
  <img src="assets/guardian/logo.svg" alt="Scam Guardian logo" width="72">
</p>

<h1 align="center">Scam Guardian</h1>

<p align="center">A pause before the money moves.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=FFFFFF" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

A light-theme Expo application for Android and web, with a product landing page and an interactive mock banking app. No real money moves. Calls and external switching are simulated; local UI edit/paste metadata and fixed authored request cues feed the frozen simulation-trained model. Demo rules remain separate, and family alerts remain local previews.

Scam Guardian demonstrates help for a person finding the transfer hard and a verification pause for a person who may be following someone else's instructions. Display categories come from demonstration policy, not a validated three-class detector.

This repository is a prototype for Dormathon 2026, Track 1, "Predict Early, Decide Better". It is an Expo application for Android and web with a product page and an interactive mock banking app.

| Session | In the demo | Response |
| --- | --- | --- |
| Normal | Saved recipient, usual amount | No interruption |
| Struggling | Three back steps or two help taps | Simple mode: one instruction at a time, with larger controls after repeated back steps |
| Coached | Call active and a new recipient | A 15-second pause that asks whether someone is directing the transfer |
| Coached, high | The above, plus a pasted account number or more than 3x the usual amount | The same pause, and a request for the trusted contact to call |

After the pause the person can still continue. Guardian adds time and support; it never blocks someone's own money.

## What is real and what is simulated

- **Money, account and recipients:** made up. No real money moves and no bank is connected.
- **Call and app-switch signals:** set by buttons in the demo. Nothing is read from the device's call state or from other apps.
- **Account number:** a real field taking 10 to 16 digits, typed or pasted. Guardian records how it was entered and the length of each change. The digits never leave the field.
- **Classification:** Normal, Struggling and Coached come from demonstration policy combining rules in `src/domain/risk.ts` and binary AI review.
- **AI review:** a frozen on-device model from the AI team scores the transfer every 5 seconds and can add a pause independently of the rules. It was trained on simulated sessions and its score is not a scam probability. See [AI model integration](#ai-model-integration).
- **Family alert:** a preview on a second phone drawn on the same screen. Nothing is sent to another device.
- **Working as shown:** the consent step, the separate trusted-contact consent, amount validation, Simple mode and the 15-second pause. The pause length is provisional, not a calibrated risk policy.

## AI model integration

A frozen model bundle from the AI team runs inside the app, on the device or in the browser. Nothing is downloaded and no server is called. Its only output is binary: recommend a review, or do not.

**The two models**

| Model | Used when | Inputs | Review threshold |
| --- | --- | --- | --- |
| `xgb_behavior_binary` (XGBoost) | No payment request is present | Behaviour only | 0.724 |
| `lr_combined_binary` (logistic regression) | An authored request has been delivered | Behaviour and request cues | 0.952 |

Both separate `Normal_or_Struggling` from `Coached`. Struggling is never a reason for an AI review. The files, thresholds and routing come from `src/domain/model/selection.json` and are unchanged from the handoff.

**How a transfer reaches the model**

1. **Collect.** `src/domain/collector.ts` turns each action in an opted-in transfer into a content-free event: an edit with its length change and whether it was typed or pasted, focus and blur, navigation, help taps, and app or window focus. No digits, names or amounts are recorded.
2. **Summarise.** Every 5 seconds `src/domain/features.ts` reduces the events so far to twenty behaviour features, their change over the last 5 seconds, and the current step.
3. **Encode the request.** If the presenter delivers one of the three authored requests, `src/domain/request.ts` turns its text into eleven yes/no cues such as urgency, secrecy and "ignore the warning". This is an English pattern matcher on a fixed demo message, not language understanding, and never a real message from another app.
4. **Score.** `src/domain/contextual_inference.mjs`, the AI team's runtime kept byte for byte, picks the model and compares its score with that model's threshold.
5. **Latch.** The first score over the threshold latches a review for the rest of that transfer. Every prediction already due is awaited before Confirm is accepted.

**What the app does with the result**

- A latched review adds the 15-second pause, with the reason "Pause and verify this payment through a contact you already trust". The read-out shows whether the rules, the AI or both raised it. The AI never overrides a stronger rule response.
- If the bundle cannot be used, the read-out says the AI is unavailable. That is never treated as a safe result, and the rules still apply.
- When the logistic regression raised the review, the app shows the actual feature contributions behind that score, which rebuild it exactly. The XGBoost model has no such breakdown here.
- The category, priority and suggested next step under "Decision support" come from a written display policy in `src/domain/decision-support.ts`. They are not learned outputs.

**What the model does not see**

The simulated call, the simulated app switch, motion, the amount and the recipient's history. Those can only drive the separate rules in `src/domain/risk.ts`.

**See it in the demo**

1. On `/demo`, pick "Coached request with warning bypass" under **Authored request** in the Guardian panel.
2. Press **Transfer**, choose the new recipient, then press **Deliver authored request**.
3. Stay on the recipient step. The review appears at the next 5-second check, with **AI** shown as its origin.

Without a delivered request, behaviour alone has not triggered a review on transfers made in this app: five app-shaped transfers scored on device stayed under 0.72.

**How well it works**

| Evaluation | Coached sessions caught | Reviews on legitimate sessions |
| --- | --- | --- |
| Original simulated test set | 647 of 720 (89.9%) | 2 of 720 |
| New authored challenge, 32 sessions | 6 of 16 (37.5%) | 2 of 16 |

- In the original test, all 60 "quiet" scams, the ones with no telling wording, were missed.
- On the challenge, a hand-set baseline using only the request cues caught 8 of 16, so the AI is not shown to be better than simple cues.
- The behaviour-only model caught 0 of 16 on the challenge. Every label there reused the same behaviour, so that result says little about behaviour either way.
- Six of the ten misses have inputs identical to a legitimate session. No model could tell those apart from what it is given.

Full results are in [the diagnosis](docs/frozen-model-diagnosis.md). Reproduce them with `node scripts/evaluate_pitch_evidence.mjs --verify`.

**Limits**

- Trained and tested on simulated sessions only. Its score is not a scam probability.
- Training used 6 typed characters for the recipient, sometimes with 4 pasted. The app's account field takes 10 to 16 digits, which is outside that range. Retraining has been requested and has not happened.
- Request cues recognise a fixed list of English phrases. Reworded instructions are missed.
- Whether a warning changes what a person does has not been measured. An [independent test set](docs/fresh-test-authoring.md) is prepared and not yet collected.

**Checks that guard the integration**

`npm test` (79 tests) confirms that the bundled files match the handoff's hashes, that the app rebuilds each of the AI team's eight worked examples from raw events with the expected model, score and decision, and that a missing bundle gives "unavailable" and never a safe result. Replaying the AI team's 4,080 sessions through the app pipeline matched their reference at all 27,924 checks; that file is 14 MB and is not committed. See `reference/ai/README.md`.

## Run

Use Node.js 22.13+ and npm (validated here with Node 22.18.0):

```sh
npm ci
npm run web
npm run android
```

Android builds require Android Studio's SDK and Java 21, plus a running emulator or connected device. `npm run android` generates the ignored native project through Expo and compiles it. The app identifier is `com.scamguardian.app` for local development; confirm ownership before a store release.

## Deploy web to Vercel

Use this app folder as the Vercel project root, framework **Other**, Node **22.x**, installation **npm ci**, build **npm run build:web**, and output **dist**. The checked-in vercel.json supplies the build settings. No environment secrets or model server are required. See [deployment instructions and hosted smoke checks](docs/vercel-deployment.md).

The hosted paths are `/demo`, `/evidence`, `/pitch-manual` and `/testing-manual`. The ten-case manual is generated from [manual-tests.md](docs/manual-tests.md). Scoring stays in the browser; export measurements before refreshing. Local build checks do not confirm an actual Vercel cloud deployment.

## Demo walkthrough

The product page at `/` only shows the bank app. Pressing the phone, or one of the four scenarios on the card beside it, opens `/demo`.

`/demo` shows three layouts: the Guardian read-out, Rohani's phone with the bank app, and Aina's phone as the trusted contact. On a wide screen they sit side by side and always fit the window. On a phone, a switch at the top moves between them.

Enable Guardian on the bank app's home screen. Family-alert consent is separate. Pick a preset under "Try these", then start a transfer:

- Normal: saved recipient, RM50, no interruption.
- Struggling: step-by-step guidance and larger controls.
- Coached: simulated call and new recipient, 15-second pause.
- Coached, high: a pasted account number as well, 15-second pause and an alert on Aina's phone if consented. That phone is a picture on the same screen; nothing is sent to another device.

A preset only sets the starting signals. Three of them can be changed by hand at any time:

- **Start simulated call** starts or ends the call.
- **Simulate app switch** shows a simulated other app and times how long it stays in front. The read-out shows this as "App switch". Neither the rules nor the model use it.
- A new recipient's account number is typed or pasted into the account field on the recipient step.

Help shows the step's instruction at once and leaves the sizes of the controls as they are. Invalid amounts cannot proceed. Back navigation preserves the pause deadline. Cancellation ends monitoring.

## Verify and preview the application

```sh
npm run lint
npm run typecheck
npm test
npm run export:platforms
node scripts/preview.mjs
```

The application preview runs at `http://127.0.0.1:4173`, with the demo at `/demo`. Both Android and web bundles go into ignored `dist/`. These exports verify compilation, not APK assembly or device behavior.

## Early warning and false-intervention measurement

See [the measurement manual](docs/warning-measurements.md) and [the current four-minute Predictive Model Track presentation](docs/four-minute-pitch.md). Choose an independent evaluation label before Transfer, then optionally deliver a fixed authored request. Recipient/amount warnings appear before Review; confirmed/cancelled sessions update the measurement panel. Export JSON before reloading; the latest 20 ended sessions are retained in app-run memory. Personalization is deferred.

Live observed warning lead includes the review cool-down and user delay. The panel separately reports the warning-to-review checkpoint; it does not claim unbiased shadow lead or real-world effectiveness. False reviews, quiet misses and model outages remain visible. Browser validation: `node scripts/browser_warning_measurements.mjs`; arithmetic/export reproduction: `node scripts/check_warning_measurements.mjs`.

## Four-minute pitch and model evidence

- `/pitch-manual.html`: complete field selections, two live cases, 354 spoken words, timing, fallback and judge Q&A. Generated from `docs/four-minute-pitch.md` with `node scripts/build_pitch_manual.mjs` before exporting.
- `/evidence`: five-criterion evidence view, shared by Android/web. Use **Pitch evidence** after ending a transfer to retain the current run's counters across navigation.
- Decision support shows the policy category, priority and next action. For a first-positive LR prefix, actual feature/missingness contributions reconstruct its score. The independent-check guide gives concrete steps but does not certify a recipient or place a call.
- `node scripts/evaluate_pitch_evidence.mjs` reproduces the authored challenge and comparison report. `--verify` requires byte-for-byte reproduction. Model files/thresholds are unchanged. The historical report is bundled as a hashed reference snapshot, so reproduction does not require the sibling research checkout.
- `node scripts/browser_warning_measurements.mjs --pitch` rehearses explanations, guide/cancel, all five evidence sections, narrow web and local manual. Output is under `data/processed/pitch-evidence-v1/browser/`.

The original simulated evaluation and new authored challenge are separate. On the new 32-session challenge, AI recall is 6/16 (37.5%), F1 0.50 and legitimate review rate 2/16 (12.5%); simple request cues do better. Missing-channel stress increases warnings. These findings prevent a claim of broad robustness or AI superiority. Human decision improvement is unmeasured; [the exploratory pilot form](docs/decision-pilot-record.md) is ready for consented testing.

`npm run typecheck` leaves out `tools/`, because the collectability harness has its own dependencies. What was checked, and what was not, is recorded in `docs/validation.md`.

## Design

The app follows direction A, "Current": a light theme with one accent, crimson `#c8102e`, taken from the bank app. The HTML studies it was chosen from were removed once the app was built; they remain in git history under `design/v2/`.

The logo is `assets/guardian/logo.svg`, a two-tone shield, shown beside the name by `src/components/guardian/wordmark.tsx`.

The Hairline canal-lock figure is `design/hairline-locks.html?theme=light&play=1`. Rebuild it with the Hairline skill's unchanged engine after editing `design/locks.js`, then copy it to `public/hairline-locks.html`.

The static Android art is generated: `node scripts/build-native-art.mjs` writes `assets/guardian/current.svg`.

## Project map

Frozen-model investigation: [executed diagnosis](docs/frozen-model-diagnosis.md) retains all ten challenge misses, a behavior-only control, paired results and uncertainty caveats. [Independent fresh-test instructions](docs/fresh-test-authoring.md) and [40 blank CSV slots](docs/fresh-test-template.csv) are ready for teammates; collection/scoring are not yet executed. Model weights, thresholds and UI are unchanged.

- `src/app/`: Expo Router landing and demo routes.
- `src/screens/`: responsive shared Android/web screens.
- `src/components/bank/`: the mock banking app, its transfer flow, the account-number field and the simulated other app.
- `src/components/glass/`: the frosted glass surface, as CSS backdrop blur on web and a translucent sheen on Android.
- `src/components/guardian/`: the read-out and presets, the product page's scenario card, the family phone, the phone frame, web beUI controls and platform art.
- `src/domain/`: the session reducer, demonstration risk rules, the signal collector, feature extraction, the on-device model bundle and tests.
- `reference/ai/`: the AI team's handoff files, kept byte for byte and used by the tests.
- `tools/collectability-harness/`: a separate Expo app that tests which behavioural fields can be collected. It is a test tool with its own `package.json`, not part of the product build.
- `design/`: the Hairline artifact and its source.
- `docs/implementation-plan.md`: research source, scope, remaining decisions and later integration work.
- `docs/validation.md`: what was verified in each round, and what was not.
- `docs/design-notes.md`: design decisions, sources and licences.
- `AGENTS.md` and `CLAUDE.md`: project instructions, including Conventional Commits.

Tailwind 4 uses an exact NativeWind 5 RC / react-native-css RC pair for this SDK. Fonts are bundled Hedvig Letters Serif and Sans.
