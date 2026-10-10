<p align="center">
  <img src="assets/guardian/logo.svg" alt="Scam Guardian logo" width="72">
</p>

<h1 align="center">Scam Guardian</h1>

<p align="center">A pause before the money moves.</p>

Scam Guardian sits inside a bank app's transfer flow. It tells apart a person who is finding the transfer hard from a person who may be following someone else's instructions, and answers each one differently: help for the first, time to think for the second.

This repository is a prototype for Dormathon 2026, Track 1, "Predict Early, Decide Better". It is an Expo application for Android and web with a product page and an interactive mock banking app.

| Session | In the demo | Response |
| --- | --- | --- |
| Normal | Saved recipient, usual amount | No interruption |
| Struggling | Three back steps or two help taps | Simple mode: larger controls, one instruction at a time |
| Coached | Call active and a new recipient | A 15-second pause that asks whether someone is directing the transfer |
| Coached, high | The above, plus a pasted account number or more than 3x the usual amount | The same pause, and a request for the trusted contact to call |

After the pause the person can still continue. Guardian adds time and support; it never blocks someone's own money.

## What is real and what is simulated

- **Money, account and recipients:** made up. No real money moves and no bank is connected.
- **Call and app-switch signals:** set by buttons in the demo. Nothing is read from the device's call state or from other apps.
- **Account number:** a real field taking 10 to 16 digits, typed or pasted. Guardian records how it was entered and the length of each change. The digits never leave the field.
- **Classification:** Normal, Struggling and Coached come from deterministic demonstration rules in `src/domain/risk.ts`.
- **AI review:** a frozen on-device model from the AI team (`src/domain/model/`) scores the transfer every 5 seconds and can add a pause. It was trained on simulated sessions and its score is not a scam probability. It has not yet been retrained for full account numbers, so for now the demo's pauses come from the rules. See `reference/ai/README.md`.
- **Family alert:** a preview on a second phone drawn on the same screen. Nothing is sent to another device.
- **Working as shown:** the consent step, the separate trusted-contact consent, amount validation, Simple mode and the 15-second pause. The pause length is provisional, not a calibrated risk policy.

## Run

Use Node.js 24+ and npm:

```sh
npm ci
npm run web
npm run android
```

Android builds require Android Studio's SDK and Java 21, plus a running emulator or connected device. `npm run android` generates the ignored native project through Expo and compiles it. The app identifier is `com.scamguardian.app` for local development; confirm ownership before a store release.

## Demo walkthrough

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

Help works immediately. Invalid amounts cannot proceed. Back navigation preserves the pause deadline. Cancellation ends monitoring.

## Verify and preview the application

```sh
npm run lint
npm run typecheck
npm test
npm run export:platforms
node scripts/preview.mjs
```

The application preview runs at `http://127.0.0.1:4173`, with the demo at `/demo`. Both Android and web bundles go into ignored `dist/`. These exports verify compilation, not APK assembly or device behavior.

`npm run typecheck` leaves out `tools/`, because the collectability harness has its own dependencies. What was checked, and what was not, is recorded in `docs/validation.md`.

## Design

The app follows direction A, "Current": a light theme with one accent, crimson `#c8102e`, taken from the bank app. The HTML studies it was chosen from were removed once the app was built; they remain in git history under `design/v2/`.

The logo is `assets/guardian/logo.svg`, a two-tone shield, shown beside the name by `src/components/guardian/wordmark.tsx`.

The Hairline canal-lock figure is `design/hairline-locks.html?theme=light&play=1`. Rebuild it with the Hairline skill's unchanged engine after editing `design/locks.js`, then copy it to `public/hairline-locks.html`.

The static Android art is generated: `node scripts/build-native-art.mjs` writes `assets/guardian/current.svg`.

## Project map

- `src/app/`: Expo Router landing and demo routes.
- `src/screens/`: responsive shared Android/web screens.
- `src/components/bank/`: the mock banking app, its transfer flow, the account-number field and the simulated other app.
- `src/components/glass/`: the frosted glass surface, as CSS backdrop blur on web and a translucent sheen on Android.
- `src/components/guardian/`: the read-out, the family phone, the phone frame, web beUI controls and platform art.
- `src/domain/`: the session reducer, demonstration risk rules, the signal collector, feature extraction, the on-device model bundle and tests.
- `reference/ai/`: the AI team's handoff files, kept byte for byte and used by the tests.
- `tools/collectability-harness/`: a separate Expo app that tests which behavioural fields can be collected. It is a test tool with its own `package.json`, not part of the product build.
- `design/`: the Hairline artifact and its source.
- `docs/implementation-plan.md`: research source, scope, remaining decisions and later integration work.
- `docs/validation.md`: what was verified in each round, and what was not.
- `docs/design-notes.md`: design decisions, sources and licences.
- `AGENTS.md` and `CLAUDE.md`: project instructions, including Conventional Commits.

Tailwind 4 uses an exact NativeWind 5 RC / react-native-css RC pair for this SDK. Fonts are bundled Hedvig Letters Serif and Sans.
