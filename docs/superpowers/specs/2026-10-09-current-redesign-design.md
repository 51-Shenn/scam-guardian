# Current redesign: design spec

Date: 9 October 2026. Status: awaiting user review.

## Goal

Replace the present landing page and wallet with direction A, "Current", chosen by the user from the v2 studies. Ship it for Android and web together, light theme only.

The reference is the approved study, not this prose: [current.html](../../../design/v2/current.html), [shared.css](../../../design/v2/shared.css) and [wallet.js](../../../design/v2/wallet.js). Where this spec and the study disagree on a visual detail, the study wins.

## What changes for the person using it

- The landing page leads with "A pause before the money moves.", a particle stream over a faint grid, and a live wallet inside a phone frame.
- The wallet looks and behaves like a familiar Malaysian e-wallet: blue balance header, Reload, a Scan / Pay / Transfer / Cards row, a service grid, a centre scan tab. It carries no third-party name or logo.
- Transfer is a three-step flow with a progress bar: recipient, amount on a keypad, review.
- A coached transfer raises a bottom sheet and a countdown ring. Confirm stays locked until the pause ends.
- A struggling transfer switches to Simple mode: larger controls and one instruction per step.
- The page art slows while a transfer is paused.

## Presentation by platform

| Surface | Desktop web (860px and up) | Narrow web | Android |
|---|---|---|---|
| Landing hero | Copy left, interactive framed wallet right, demo console overlapping the frame | Copy, demo console, then a cropped frame preview | Same as narrow web |
| Frame preview | Fully interactive | Not interactive. Tapping it opens `/demo` | Same as narrow web |
| `/demo` | Framed wallet centred, demo console beside it | Wallet full screen, no frame | Wallet full screen, no frame |
| Particle art | Animated 2D canvas | Animated 2D canvas, fewer particles | Static SVG of the same flow field |
| Canal-lock figure | Interactive Hairline figure | Interactive, scaled | Static SVG of its rest pose |
| Simulated-call island | In the frame's status area | In the preview only | In the preview only. On `/demo` the read-out states the call fixture |

The three Android differences in the last rows are capability boundaries, recorded here as AGENTS.md requires: no render loop for decoration on Android, and the Hairline engine is DOM-based.

## Units

Each unit has one job and can be understood without reading the others.

1. **Session logic**, `src/domain/session.ts`. A pure reducer holding everything the wallet screen keeps in `useState` today: step, scenario, consents, balance, amount, recipient, help taps, back presses, pause deadline, open sheet. It exposes `reduce(state, action)` and `derive(state, now)`, which returns the signals, the decision from the existing `evaluate`, `simple`, `paused` and `remaining`. No React, no platform imports. `risk.ts` is unchanged.
2. **Session provider**, `src/components/wallet/session.tsx`. Wraps the reducer in context so the wallet, the demo console, the read-out and the art all read one state. It owns the one timer that ticks during a pause.
3. **Wallet views**, `src/components/wallet/`. Shared React Native and NativeWind, one file per screen: `home`, `recipient`, `amount` (with `keypad`), `review` (with `pause-card`), `success`, plus `consent-sheet` and `pause-sheet`. A `wallet.tsx` container picks the view and plays the push transition. These files do not know whether they are inside a frame.
4. **Platform pairs**, same props on both sides, following the existing `action` pattern:
   - `sheet.web.tsx` uses beUI Bottom Sheet; `sheet.tsx` uses React Native `Modal` with a slide animation.
   - `toggle.web.tsx` uses beUI Switch; `toggle.tsx` uses the native switch.
   - `action` already exists and is restyled to the pill shape.
5. **Phone frame**, `src/components/guardian/phone-frame.tsx`. Shared React Native views: titanium border, bezel, status bar, island, home indicator, and a `scale` prop. `interactive={false}` renders the preview with a single press target.
6. **Flow art**, `flow-art.web.tsx` (canvas, ported from the study) and `flow-art.tsx` (static SVG). Both take `paused`. `scripts/build-native-art.mjs` generates the SVG from the same field function.
7. **Demo console**, `src/components/guardian/demo-console.tsx`. Shared. Scenario switch plus the Guardian read-out.
8. **Lock figure**, `lock-figure.web.tsx` (the existing Hairline page served from `public/`) and `lock-figure.tsx` (static SVG).
9. **Screens**, `src/screens/landing.tsx` and `src/screens/wallet.tsx`. Composition only.

## Data flow

A press in a wallet view dispatches an action. The reducer returns the next state. `derive` computes the decision. The wallet, console, read-out and art re-render from that one result. Nothing in the transfer flow leaves the device, and no account number, name or amount is passed to anything outside the session.

## Tokens

`src/global.css` takes the study's values: page `#f4f7fc`, ink `#0c1a33`, muted `#4d5b74`, line `#d3dcec`, accent cobalt `#1447e6`. The wallet keeps its own palette (blue `#0a5bd3`, deep blue `#073f9c`, yellow `#ffd31f`, amber for pause states). Shape rule: pill buttons, 14px controls, 24px surfaces. Hedvig Letters Serif for display, Hedvig Letters Sans for everything else.

## Rules that must survive the redesign

- Monitoring runs only inside an opted-in transfer session. Consent is asked on the first Transfer tap and can be withdrawn from the Guardian pill.
- Trusted-contact consent is separate and off by default.
- The family alert is a local preview that says nothing was sent.
- The pause is 30 seconds. The study's 10 seconds does not carry over.
- After the pause the person can continue. Cancel is always available.
- Struggling gets guidance, never a warning.
- Every simulated signal is labelled as simulated. The page states that a browser cannot observe calls.
- No analytics, no invented statistics, testimonials or partner logos.

## Motion

Entry reveal on sections, press feedback on controls, push transition between wallet steps, sheet rise, countdown ring, island expansion, particle stream. Each communicates a state change or feedback. Under reduced motion all of them become instant and the particle canvas renders one still frame. The canvas pauses when offscreen or when the tab is hidden.

## Icons

Phosphor, regular and fill, to match the study. The plan's first step checks that `phosphor-react-native` and `react-native-svg` install cleanly on Expo SDK 57 through `npx expo install`. If they do not, work stops and the choice comes back to the user.

## Removed

- `src/constants/designs.ts`, the "Choose a visual direction" section, and the `design` URL parameter.
- The Three.js hero, and the `three` and `@types/three` dependencies.
- `field` components, replaced by the keypad.
- The v1 HTML studies (`fluid`, `grid`, `ledger`, the v1 index) and `scripts/build-design-samples.mjs` with its `samples` script. `hairline-locks.html` and the v2 studies stay.
- Unused starter components and assets that nothing imports after the change.

## Errors

- Amount validation keeps its three messages and shows them above the keypad.
- If the canvas context is unavailable the hero keeps its CSS grid and renders without particles.
- If fonts fail to load the app still renders with the system fallbacks already declared.

## Verification

- Unit tests for the session reducer: each fixture's path, pause deadline kept across back navigation, confirm refused during the pause, consent off means no monitoring, balance arithmetic.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run export:platforms`.
- Browser checks at 412, 768, 1024 and 1440 wide: no horizontal overflow, the four scenarios end to end, keyboard operation, reduced motion.
- Android emulator: landing, preview tap, the four scenarios, safe areas, text scaling. Reported as emulator checks, not device tests.

## Out of scope

Real call or paste signals, alert delivery to a second device, a trained model, Bahasa Malaysia and Chinese copy, Mango Grotesque, and directions B and C.

## Decisions taken by default

These were not asked. Any of them can be reversed before the plan is written.

1. The amount is entered on a custom keypad on both platforms, replacing the native text field.
2. Android gets static art and a static lock figure rather than animated ones.
3. The existing canal-lock figure is reused. No new Hairline figure is drawn.
4. The v1 studies and the three-way design switcher are deleted.
5. The frame is a generic Pro Max with a Dynamic Island, because no verified iPhone 18 Pro Max reference was available.
