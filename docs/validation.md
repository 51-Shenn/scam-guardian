# Verification on 9 October 2026

## Current redesign

Checked on 9 October 2026 after rebuilding the landing page and wallet as direction A, "Current".

**Project gates**

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 19 of 19 passed (6 risk rules, 13 session reducer).
- `npm run export:platforms`: Android Hermes bundle and static web export both written. Metro printed a cache-read warning and fell back to a full crawl; the export exited 0.

**Web, exported build served locally, Chrome via Playwright**

- `/` and `/demo` at 412, 768, 1024 and 1440 wide: no horizontal overflow, no console errors, no em or en dashes in visible copy.
- Normal: consent asked on first Transfer, review without a pause, balance RM 2,450.00. Passed at 1440 and 412.
- Struggling: guidance banner and larger controls on the recipient step. Passed at 1440 and 412.
- Amount 9999 shows "This amount exceeds the demo balance." Passed at 1440 and 412.
- Coached, high with the trusted-contact switch on: simulated paste tag, pause sheet, alert preview with "Nothing was sent to another device", Continue disabled, countdown from 30, Continue enabled after 30 seconds, transfer completes. Passed at 1440 and 412.
- Coached without trusted-contact consent: pause sheet with no alert preview; Cancel returns home with the balance intact and the read-out inactive. Passed at 1440.
- Guardian declined: Coached, high completes with no pause and the read-out says Guardian is off. Passed at 1440.
- Simulated-call island: shows "Simulated call" with a running timer. Passed at 1440.
- Keyboard: Tab reaches Transfer, Enter operates it, digits and Backspace edit the amount, focused controls show an outline. Passed at 1440.
- Art: the canvas changed about 131,000 pixels in 600 ms normally and about 13,000 during a pause. Under emulated reduced motion it changed 0.
- Layout compared by eye against `design/v2/current.html` at 1440, 1024 and 412.
- Lock figure, found after the round above: a mouse wheel over the figure scrolled the Hairline page inside its frame by 91 to 164 pixels and showed its slider and its theme and play buttons, and the three controls could take keyboard focus. After the fix, at 1440, 1024 and 412: no bench control, label or note is displayed, the frame cannot scroll, a wheel over the figure scrolls the page, nothing inside the frame takes focus, and the gates still answer the pointer.

**Android, Pixel_10_Pro_XL emulator (x86_64), debug build loading JavaScript from Metro**

- `npx expo run:android` built and installed the app with the new native modules (react-native-svg, expo-linear-gradient).
- The emulator showed the same System UI "isn't responding" dialog at full resolution as in the earlier round. Checks ran after reducing its display to 896x1996 at 320dpi (448dp wide). The override was reset afterwards.
- Landing: serif headline, static flow art, compact console, cropped frame preview. Tapping the preview opens the wallet full screen. Passed.
- Wallet: blue header runs under the status bar; nothing is covered by the status bar or the gesture bar. Checked by eye on captures.
- Normal with the amount edited to RM 75 on the keypad: balance RM 2,425.00. Passed.
- Struggling: guidance banner. Passed.
- Coached, high with the trusted-contact switch on: paste tag, pause sheet, alert preview, completion after the pause. Passed.
- Continue during the pause: read 9.8 seconds after Review, the button was disabled in the accessibility tree, and a tap at 10.0 seconds did nothing. Passed.
- System back: amount to recipient, recipient to wallet home, wallet home to landing, and closing the pause sheet while staying on review. Passed.
- System font scale 1.3: landing, wallet home, consent sheet, Simple mode recipient step and amount step captured; no clipped labels seen.

**Not verified**

- No physical Android device. These are emulator checks on a software-rendered image, not a performance measurement.
- No screen reader pass (TalkBack or a desktop reader). Roles, labels and live regions are set but were not listened to.
- Browsers other than Chrome.
- The standalone release build. The APK is a debug build that needs Metro.
- Android at widths of 860dp and above (tablets, landscape), where the framed layout would apply.
- The re-captured Android lock still (the drawing alone, 1276 x 1020, shown at 5:4). The image was checked by eye and the Android export passed, but it was not looked at on the emulator.

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
