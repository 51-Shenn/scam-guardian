# Scam Guardian

A light-theme Expo application for Android and web, with a product landing page and an interactive mock banking app. No real money moves. Calls and external switching are simulated; local UI edit/paste metadata and fixed authored request cues feed the frozen simulation-trained model. Demo rules remain separate, and family alerts remain local previews.

## Run

Use Node.js 22.13+ and npm (validated here with Node 22.18.0):

```sh
npm ci
npm run web
npm run android
```

Android builds require Android Studio's SDK and Java 21, plus a running emulator or connected device. `npm run android` generates the ignored native project through Expo and compiles it. The app identifier is `com.scamguardian.app` for local development; confirm ownership before a store release.

## Design

The app follows direction A, "Current". The HTML studies it was chosen from were removed once the app was built; they remain in git history under `design/v2/`.

The Hairline canal-lock figure is `design/hairline-locks.html?theme=light&play=1`. Rebuild it with the Hairline skill's unchanged engine after editing `design/locks.js`, then copy it to `public/hairline-locks.html`.

The static Android art is generated: `node scripts/build-native-art.mjs` writes `assets/guardian/current.svg`.

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

## Demo walkthrough

`/demo` shows three layouts: the Guardian read-out, Rohani's phone with the bank app, and Aina's phone as the trusted contact. On a wide screen they sit side by side and always fit the window. On a phone, a switch at the top moves between them.

Enable Guardian on the bank app's home screen. Family-alert consent is separate. Pick a preset under "Try these", then start a transfer:

- Normal: saved recipient, RM50, no interruption.
- Struggling: step-by-step guidance and larger controls.
- Coached: simulated call and new recipient, 15-second pause.
- Coached, high: a pasted account number as well, 15-second pause and an alert on Aina's phone if consented. That phone is a picture on the same screen; nothing is sent to another device.

A preset only sets the starting signals. The simulated call can be started or ended at any time, and a new recipient's account number can be typed or pasted by hand.

Help works immediately. Invalid amounts cannot proceed. Back navigation preserves the pause deadline. Cancellation ends monitoring. The uniform pause duration is provisional; it is not a calibrated risk policy.

## Project map

Frozen-model investigation: [executed diagnosis](docs/frozen-model-diagnosis.md) retains all ten challenge misses, a behavior-only control, paired results and uncertainty caveats. [Independent fresh-test instructions](docs/fresh-test-authoring.md) and [40 blank CSV slots](docs/fresh-test-template.csv) are ready for teammates; collection/scoring are not yet executed. Model weights, thresholds and UI are unchanged.

- `src/app/`: Expo Router landing and demo routes.
- `src/screens/`: responsive shared Android/web screens.
- `src/components/bank/`: the mock banking app and its transfer flow.
- `src/components/glass/`: the frosted glass surface, as CSS backdrop blur on web and a translucent sheen on Android.
- `src/components/guardian/`: the read-out, the family phone, the phone frame, web beUI controls and platform art.
- `src/domain/`: deterministic risk rules, validation and tests.
- `design/`: the Hairline artifact and its source.
- `docs/implementation-plan.md`: research source, scope, remaining decisions and later integration work.
- `AGENTS.md` and `CLAUDE.md`: project instructions, including Conventional Commits.

Tailwind 4 uses an exact NativeWind 5 RC / react-native-css RC pair for this SDK. Fonts are bundled Hedvig Letters Serif and Sans. Source and license notes are in `docs/design-notes.md`.
