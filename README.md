# Scam Guardian

A light-theme Expo application for Android and web, with a product landing page and an interactive mock banking app. No real money moves. Call and paste signals are simulated, classification uses demonstration rules, and family alerts remain local previews.

## Run

Use Node.js 24+ and npm:

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

## Demo walkthrough

`/demo` shows three layouts: the Guardian read-out, Rohani's phone with the bank app, and Aina's phone as the trusted contact. On a wide screen they sit side by side and always fit the window. On a phone, a switch at the top moves between them.

Enable Guardian on the bank app's home screen. Family-alert consent is separate. Pick a preset under "Try these", then start a transfer:

- Normal: saved recipient, RM50, no interruption.
- Struggling: step-by-step guidance and larger controls.
- Coached: simulated call and new recipient, 30-second pause.
- Coached, high: a pasted account number as well, 30-second pause and an alert on Aina's phone if consented. That phone is a picture on the same screen; nothing is sent to another device.

A preset only sets the starting signals. The simulated call can be started or ended at any time, and a new recipient's account number can be typed or pasted by hand.

Help works immediately. Invalid amounts cannot proceed. Back navigation preserves the pause deadline. Cancellation ends monitoring. The uniform pause duration is provisional; it is not a calibrated risk policy.

## Project map

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
