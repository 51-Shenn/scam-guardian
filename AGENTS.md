This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Scam Guardian project rules

- Always commit completed changes with Conventional Commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, or `chore:`. Keep commits focused. Never push or merge without authorization.
- Target Android AND web together in every feature and change. Consider desktop web, narrow web, Android safe areas, touch targets, keyboard access, text scaling, layouts, and styles together. A web-only implementation is incomplete unless it has a corresponding native presentation or an explicitly documented platform capability boundary.
- Use React Native with Expo SDK 57 and Expo Router. The user's Expo requirement supersedes the research brief's Kotlin application plan. iOS is outside the current scope.
- Light theme only, including when the device/browser prefers dark. No dark-theme toggle.
- Use Tailwind CSS 4 with the pinned NativeWind 5 RC / react-native-css RC pair. Keep RC versions exact and validate both target exports after styling changes.
- Use beUI's licensed, official React DOM source for suitable web controls. Keep DOM, Motion, Three.js, and browser APIs in `.web.tsx` components. Provide native equivalents with the same public props and behavior. Shared business logic must not depend on either presentation.
- Use Hedvig Letters Serif for display typography and a readable sans face for forms and long text. Bundle font assets. Do not silently substitute another font for Mango Grotesque if later requested.
- Product pages may use restrained particles, technical grids, flowing forms, and the selected Hairline canal-lock illustration. Keep transfer controls calm and readable. Honor reduced motion and pause graphics when hidden/offscreen. Three.js is optional and must earn its cost.
- Apply the Taste skill to marketing surfaces; use native and accessible form patterns for the wallet. User requirements override skill defaults (especially light-only theme and Expo/Tailwind).
- The current deliverable is BOTH a product page and an interactive mock-wallet demo. Signals and family alerts are explicitly simulated. Do not imply a browser can observe phone calls, that WhatsApp detection is implemented, or that a second phone received a local preview.
- Classify Normal, Struggling, and Coached separately. Struggling users receive guidance rather than suspicion. Explain interventions in plain language. Preserve the user's ability to proceed after a cool-down.
- Collect no call audio, caller identity, clipboard contents, or raw cross-app activity. Monitoring belongs only to an opted-in transfer session. Never put account numbers, names, or amounts into model inputs or family alerts. Do not add analytics to the transfer flow.
- Do not invent trained model weights, validation results, probabilities, user testimonials, banking integrations, or security guarantees. Keep demo rules, future model work, and measured results distinct.
- Before completing code changes, run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run export:platforms` (Android AND web). Report device/emulator tests honestly; Metro exports are not APK builds or device tests.
- Read `CONTEXT.md` for domain terminology and `docs/implementation-plan.md` for scope, confirmed decisions, and unanswered questions. Ask one material clarification at a time while continuing independent work.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
