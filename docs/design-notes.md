# Design

Reading this as a light, technical product page for hackathon judges, paired with an accessible transfer flow for older Malaysians.

The app follows direction A, "Current", chosen by the user on 9 October 2026 from three v2 studies. The earlier Fluid Guardian, Signal Grid and Human Ledger studies were retired.

Taste dials for the landing page: design variance 7, motion intensity 6, visual density 4. The bank app is product UI and is out of the Taste skill's scope; it follows native, accessible form patterns.

The user's explicit light theme, Expo, Tailwind and grid/particle requirements override conflicting skill defaults. Hedvig Letters Serif was named in the brief, which is the Taste skill's condition for a serif display face. The hero's visual is the working bank app itself, not a mock screenshot.

## Current

- Landing hero: on 11 October 2026 the user asked for the first design back, after a round that had set the card apart from the phone. Beside the phone, the scenario glass card is centred on it and laps 28 pixels over the frame's edge, so the frosted glass has the bank app to blur and the pair has depth. The card moves below the copy when the headline column would be too narrow. Live measurements stay out of the hero.

- Palette: page `#faf6f6`, ink `#22141a`, one accent, crimson `#c8102e`. On 10 October 2026 the user asked for the whole product to take the bank app's red, replacing the cobalt accent: page art, logo, buttons, Guardian's surfaces inside the bank app, and the trusted contact's lock screen. The bank app adds garnet `#8a0b20`. Amber still marks pause states, so a pause never looks like the brand colour. In the read-out, the three classes keep their own data colours: red would read as an accusation, and Struggling calls for help instead. Since 10 October 2026 these are three deep tones chosen to sit with the garnet: pine `#1f6b57` for Normal, indigo `#414f8f` for Struggling and bronze `#a3661c` for Coached, each with a darker text shade and a pale wash. A signal that points towards a class carries that class's tone as a dot and the text shade; the AI review shows its state as a rule down the side of its box. The scenario card and the presets use the same three.
- Type: Hedvig Letters Serif for display, Hedvig Letters Sans for everything else.
- Shape: pill buttons, 14px controls, 24px surfaces.
- Art: a flow field of particles over a faint 44px grid. It slows while a transfer is paused, so the page tells the same story as the bank app. Android shows the field drawn once and dims it during a pause.
- Bank app: on 10 October 2026 the user replaced the e-wallet with a banking app, with a Malaysian retail bank app as the reference for arrangement and colour: account card with available balance, Transfer / Pay bills / Scan QR / Top up, service grid, recent activity, floating tab bar. No third-party name or logo. The account, its masked number and the activity rows are made up and labelled as demo data.
- Glass: surfaces are frosted glass over soft colour fields (`src/components/bank/backdrop.tsx`). On web this is CSS `backdrop-filter`, with the four tones in `global.css`. Android has no backdrop blur without a native blur module, so `glass.tsx` draws the same tones as a translucent gradient; the white and dark tones are near opaque there, because unblurred text would show through. `expo-blur` was not added: it needs a new native build and could not be checked on a device in this round.
- Demo: three layouts, taken from the team's prototype artifact. Guardian read-out with the presets, Rohani's phone, and Aina's phone as the trusted contact. The wide stage has a fixed natural size and scales as one piece, so nothing scrolls. On a phone a switch at the top shows one layout at a time.
- Read-out: the three class bars are on or off. The artifact showed percentages from illustrative weights; the project rules forbid invented probabilities, so the bars show only which class the demonstration rules picked.
- Frame: a generic Pro Max outline with a Dynamic Island. No verified iPhone 18 Pro Max reference was available. The island shows the simulated call, labelled as simulated.

## Source and licensing

- The actual web action wraps the official beUI base button from `starc007/ui-components`, retrieved 9 October 2026. Source: https://github.com/starc007/ui-components/blob/main/components/motion/button/base.tsx. Original button source stays in `src/components/beui/base.web.tsx`; MIT notice is retained in `docs/vendor/beui-LICENSE.txt`. Supporting motion tokens are taken from the official documentation; the hover capability hook uses an SSR-safe subscription.
- The web switch is the official beUI source, unmodified, from commit `9deb728` of `starc007/ui-components` (`components/motion/switch.tsx`), kept in `src/components/beui/switch.web.tsx` under the same MIT notice.
- Android landing actions are plain React Native pressables styled to the same pill as the beUI web button. A Material button was tried and dropped: it derives its own tone from a seed colour and cannot show the exact accent. Inside the bank app, buttons and the amount keypad are shared React Native controls, identical on both platforms.
- Hedvig font packages include their OFL notices. The licence texts also sit in `design/`.
- The canal-lock figure uses the Hairline skill's unchanged engine and bench. Its standalone bench supports both themes; Scam Guardian links to its light theme. The application itself is light-only. The app shows the drawing alone: on web the embedding component hides the bench's slider, buttons, labels and notes and stops the frame scrolling, and the Android still is captured without them.
- Hairline rules: 1, 2, 4, 6, 8 and 9. The tour visits the upper, middle and lower chambers, then returns to rest. Static, frame, read-out, console and visual checks passed; see `docs/validation.md` for the restrained-motion note. User feedback on the Play lap is still welcome.
- The page art is a 2D canvas in a `.web.tsx` island. Its strokes are drawn at full strength on a canvas shown at 20% opacity, so the residue an 8-bit canvas cannot erase stays below a visible step. It limits DPR, sleeps offscreen and in hidden tabs, honours reduced motion with one still frame, and cleans up its observers. Android uses a bundled static SVG of the same field; `scripts/build-native-art.mjs` reproduces it without network access or a render loop. Three.js was removed.
- Icons are Phosphor (MIT), through `phosphor-react-native`, imported only in `src/components/bank/icons.ts`.
- The bank app's sheet is a shared in-app component, not the beUI Bottom Sheet: beUI's sheet portals to the page body and pins to the browser viewport, so it cannot open inside the phone frame.

## Studies

The three self-contained v2 studies (Current, Signal, Tide) and their chooser were removed once Current was built. They remain in git history under `design/v2/`. They shared one vanilla-JS wallet whose rules mirrored `src/domain/risk.ts`, with a 10-second pause for quick comparison. The app uses 15 seconds.
