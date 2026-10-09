# Design study

Reading this as a light, technical product page for hackathon judges, paired with an accessible transfer flow for older Malaysians.

Taste dials for marketing: design variance 6, motion intensity 4, visual density 3. Wallet: variance 3, motion 2, density 4. This is a greenfield product atop a starter, not a brand-preserving redesign.

The user's explicit light theme, Expo, Tailwind and grid/particle requirements override conflicting skill defaults. Procedural canvas/Three.js and the requested Hairline figure are the primary visual assets; stock photography is not required to explain these concepts. Taste applies to the marketing page, not to the multi-step native wallet.

## Directions

- Fluid Guardian: cool light blue, organic line fields, soft 24/32px presentation surfaces. Selected by the user for the primary design.
- Signal Grid: green, precise signal fields, a structured split composition. Strongest technical framing.
- Human Ledger: Hedvig serif, pale paper and brown, more space and linework. Strongest human framing.

Display uses Hedvig Letters Serif; body uses Hedvig Letters Sans. No Mango imitation is presented as the real font. Controls have 12px corners, content surfaces 24px, art panels 32px (grid 16px, ledger arch in the HTML study). Each sample locks its own accent across its page; wallet risk colors convey semantic state.

## Source and licensing

- The actual web action wraps the official beUI base button from `starc007/ui-components`, retrieved 9 October 2026. Source: https://github.com/starc007/ui-components/blob/main/components/motion/button/base.tsx. Original button source stays in `src/components/beui/base.web.tsx`; MIT notice is retained in `docs/vendor/beui-LICENSE.txt`. Supporting motion tokens are taken from the official documentation; the hover capability hook uses an SSR-safe subscription.
- The standalone HTML samples use native browser controls and compiled Tailwind; they are design studies, not claims that beUI ships a framework-free library.
- Android actions use Expo UI's universal native Button and Host. Text entry has native and web presentations with identical behavior.
- Hedvig font packages include their OFL notices. The sample builder embeds the bundled fonts; their license is included alongside the samples.
- The canal-lock figure uses the Hairline skill's unchanged engine and bench. Its standalone bench supports both themes; Scam Guardian links to its light theme. The application itself is light-only.
- Three.js appears only in a decorative `.web.tsx` island. It limits DPR and frame rate, sleeps offscreen/hidden, honors reduced motion, disposes resources, and degrades to a static background if WebGL fails. Android uses bundled static SVG line fields and grids with the same palette and meaning; `scripts/build-native-art.mjs` reproduces these assets without network access or a render loop.

## Sample scope

Three self-contained HTML files provide distinct compositions, working anchor navigation, native dialog behavior, form validation and sample scenario responses. Their small form explains that it is a preview. The full Expo wallet supplies consent, validation, deadline checks, cancellation, and the 30-second pause. None of these surfaces moves money or sends alerts.
