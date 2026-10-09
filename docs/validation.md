# Verification on 9 October 2026

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: all six domain tests passed, covering rule precedence, validation and exact pause deadlines.
- `npm run export:platforms`: Android Hermes and static web exports passed with the bundled native SVG assets.
- Browser checks: all three HTML studies at 1440px and 390px, dialog controls, app landing, amount validation, immediate enlarged help, normal transfer, high-risk pause, separately consented local alert, pause retention after back navigation and recipient changes, deadline expiry, medium-risk no-alert behavior, cancellation, keyboard focus and enforced light theme. No browser JavaScript exceptions observed.
- The web cancellation regression checks that the wallet heading returns into view after leaving a scrolled form.
- Hairline: static validation and automated look checks passed; light/dark, rest/answer, slider bounds, read-outs and console inspected. The eight-view sheet and motion strip were visually reviewed. The gates deliberately make a restrained movement; the tool reported 33% changed thumbnail ink against its 37% guidance, without a validation failure.
- Android debug APK: Gradle assembly passed for all four architectures. Expo subsequently built and installed the x86_64 debug version on the Pixel_10_Pro_XL emulator.
- Native functional checks: landing typography and bundled SVG, consent, recipient choice, editing RM50 to RM75, review, confirmation to an RM2425 balance, immediate larger guidance and cancellation to inactive monitoring.

The software-rendered emulator showed a System UI startup ANR at full resolution. Checks continued after reducing its display to 896x1996 at 320dpi (448dp wide). After the earlier successful native flow checks, the emulator display stopped updating during a Metro refresh, while accessibility snapshots continued changing. The final white input fill and per-step scroll reset passed lint, type checking, Android export and browser regression checks; their final native visual recheck remains pending on a responsive emulator or physical device. The test display overrides were reset and the test emulator shut down. These are functional checks, not a performance benchmark. Physical-device verification, real call signals, second-device delivery, model calibration and reviewed BM/Chinese translations remain later work.

The APK is a development build that loads JavaScript from Metro. It is not a standalone store release.
