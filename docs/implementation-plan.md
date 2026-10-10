# Scam Guardian implementation plan

Source: [Dormathon 2026 Scam Guardian Research Brief](https://docs.google.com/document/d/1nKndAHXPaUXkXtLysq4Q9J2w6yIjWXR4NWJG7Bj4tSY/edit), read 9 October 2026. The document is research/proposal material; its market, legal, competitor, and performance claims are not independently verified product claims.

## Confirmed decisions

- Build BOTH a product landing page and an interactive mock banking app demo. The demo was an e-wallet until 10 October 2026, when the user asked for a banking app with frosted glass and the three-layout demo from the team's prototype artifact (read-out, Rohani's phone, Aina's phone).
- Expo/React Native replaces the proposed Kotlin application; Android and web progress together. iOS is out of scope.
- Light theme, Tailwind CSS, technical grids/particles, flowing forms, and Hedvig Letters Serif (with Hedvig Letters Sans for readable controls).
- The user selected direction A, "Current", from the v2 studies on 9 October 2026. Spec: `docs/superpowers/specs/2026-10-09-current-redesign-design.md`.
- Hairline metaphor: canal locks whose gates answer the pointer, showing a pause before passage.
- Use labelled demo signals and a local family-alert preview first. Real Android integration and second-phone delivery are later work, explicitly agreed by the user.

## Current slice

Product page with a live bank app in a phone frame, a demo console, privacy explanation and the canal-lock figure. On desktop web the bank app is interactive in the frame; on narrow web and Android the frame is a preview that opens the demo full screen. The demo route shows the Guardian read-out, the bank app and the trusted contact's phone together. The transfer experience is shared: Home, Choose recipient, Enter amount on a keypad, Review/Confirm, Success. It uses mock balance and recipients, local consent, simple mode, deterministic demonstration rules, a real 15-second cool-down, cancellation, and a clearly labelled family-alert preview on a second phone drawn on the same screen. The simulated call can be switched at any time and a new recipient's account number is typed or pasted by hand; presets set the starting signals. No real money moves.

Demo rules illustrate the brief's hard-rule example: call active + new recipient + (paste flag OR amount greater than 3x usual) pauses a coached transfer. Back presses/help taps enable simple mode. A call and new recipient without the hard-rule combination demonstrate medium risk. No trained probabilities are shown.

The product page and demo render at desktop width, narrow web width, and native Android width. Web beUI controls and Android native controls share behavior. All graphics respect reduced motion; no animation competes with payment controls.

## Delivery sequence

1. Instructions, glossary, Tailwind setup, bundled typography, source/licensing notes, three HTML design samples.
2. Shared transfer state, input validation, privacy consent, risk rule demonstrations, timers, guidance, and local contact preview.
3. Visual selection and refinement after user feedback; native/web visual QA and device tests.
4. Android signal adapter: cellular call-state permission and capability spike; paste metadata without clipboard access; app lifecycle timing. Browser adapter stays explicit about unsupported signals. Do not assume WhatsApp calls are detectable with cellular APIs.
5. Train and evaluate the three-class model with a data card. Import verified weights with a documented feature order/normalisation; retain rules as an independent safety layer.
6. Separate consent and real alert transport with tested delivery on a second device. No bank/DuitNow integration in this prototype.

## Questions to resolve before later slices

- Is the 24-hour event deadline still the delivery constraint? What Android device and Expo Go/development-build environment will be used?
- English first for this design study; when must BM and Chinese translations be complete and reviewed? Font fallback for Chinese needs device QA.
- The brief references thresholds in an absent Section 3. What are calibrated medium/high model thresholds and how long does high-risk holding last? The current demo uses a uniform 15-second pause, not claimed calibrated policy.
- Are trained weights available? The proposal mentions both approximately 90 role-play sessions and 10 people x 3 sessions (30); confirm the evaluation sample count before reporting results.
- How should missing/denied Android permissions degrade? How should cellular, VoIP, and trusted-family calls be distinguished without collecting caller identity?
- What exact mechanism should deliver family alerts to another device, and who owns consent and contact verification?

## Validation and limits

Lint, TypeScript, domain tests, Android/web exports, browser checks and a local Android debug APK build have passed. Native emulator checks cover the main transfer and guidance flow. See [verification details](validation.md) for the exact coverage and emulator limitation. Physical-device verification remains later work. Never present export success as a device test.

NativeWind's pinned v5 RC pair is documented against this SDK: [installation](https://www.nativewind.dev/v5/getting-started/installation). beUI is DOM-oriented: [official source](https://github.com/starc007/ui-components). The page art is a 2D canvas and needs no WebGL.
