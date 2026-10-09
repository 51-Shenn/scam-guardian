# Design

Reading this as a light, technical product page for hackathon judges, paired with an accessible transfer flow for older Malaysians.

The app follows direction A, "Current", chosen by the user on 9 October 2026 from three v2 studies (`design/v2/`). The earlier Fluid Guardian, Signal Grid and Human Ledger studies were retired.

Taste dials for the landing page: design variance 7, motion intensity 6, visual density 4. The wallet is product UI and is out of the Taste skill's scope; it follows native, accessible form patterns.

The user's explicit light theme, Expo, Tailwind and grid/particle requirements override conflicting skill defaults. Hedvig Letters Serif was named in the brief, which is the Taste skill's condition for a serif display face. The hero's visual is the working wallet itself, not a mock screenshot.

## Current

- Palette: page `#f4f7fc`, ink `#0c1a33`, one accent, cobalt `#1447e6`. The wallet has its own product palette (blue, deep blue, yellow, amber for pause states).
- Type: Hedvig Letters Serif for display, Hedvig Letters Sans for everything else.
- Shape: pill buttons, 14px controls, 24px surfaces.
- Art: a flow field of particles over a faint 44px grid. It slows while a transfer is paused, so the page tells the same story as the wallet. Android shows the field drawn once and dims it during a pause.
- Wallet: the familiar e-wallet arrangement (balance header, Reload, Scan / Pay / Transfer / Cards, service grid, centre scan tab), with no third-party name or logo.
- Frame: a generic Pro Max outline with a Dynamic Island. No verified iPhone 18 Pro Max reference was available. The island shows the simulated call, labelled as simulated.

## Source and licensing

- The actual web action wraps the official beUI base button from `starc007/ui-components`, retrieved 9 October 2026. Source: https://github.com/starc007/ui-components/blob/main/components/motion/button/base.tsx. Original button source stays in `src/components/beui/base.web.tsx`; MIT notice is retained in `docs/vendor/beui-LICENSE.txt`. Supporting motion tokens are taken from the official documentation; the hover capability hook uses an SSR-safe subscription.
- The web switch is the official beUI source, unmodified, from commit `9deb728` of `starc007/ui-components` (`components/motion/switch.tsx`), kept in `src/components/beui/switch.web.tsx` under the same MIT notice.
- The standalone v2 studies use native browser controls and hand-written CSS; they are design studies, not claims that beUI ships a framework-free library.
- Android landing actions use Expo UI's universal native Button and Host. Inside the wallet, buttons and the amount keypad are shared React Native controls, identical on both platforms.
- Hedvig font packages include their OFL notices. The v2 studies load copies from `design/v2/fonts`; the licence texts sit in `design/`.
- The canal-lock figure uses the Hairline skill's unchanged engine and bench. Its standalone bench supports both themes; Scam Guardian links to its light theme. The application itself is light-only.
- Hairline rules: 1, 2, 4, 6, 8 and 9. The tour visits the upper, middle and lower chambers, then returns to rest. Static, frame, read-out, console and visual checks passed; see `docs/validation.md` for the restrained-motion note. User feedback on the Play lap is still welcome.
- The page art is a 2D canvas in a `.web.tsx` island. It limits DPR, sleeps offscreen and in hidden tabs, honours reduced motion with one still frame, and cleans up its observers. Android uses a bundled static SVG of the same field; `scripts/build-native-art.mjs` reproduces it without network access or a render loop. Three.js was removed.
- Icons are Phosphor (MIT), through `phosphor-react-native`, imported only in `src/components/wallet/icons.ts`.
- The wallet sheet is a shared in-wallet component, not the beUI Bottom Sheet: beUI's sheet portals to the page body and pins to the browser viewport, so it cannot open inside the phone frame.

## Studies

`design/v2/` holds the three self-contained v2 studies and their chooser. They share one vanilla-JS wallet whose rules mirror `src/domain/risk.ts`, with a 10-second pause for quick comparison. The app uses 30 seconds. The Signal study's Mango Grotesque files are not tracked.
