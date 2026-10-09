# Scam Guardian · collectability harness

A small Expo (React Native for Web) app that checks whether the fields in
**"Scam Guardian — Production Data Requirements for the Software Team"** (C01–C09)
can actually be collected. It runs a mock transfer flow (recipient → amount → review)
and shows every field live in a "Live fields" panel.

It is a **test tool, not the product**. `src/collector.ts` is the part intended to be
reused in the real app after refactoring.

## Files

| File | Purpose |
| --- | --- |
| `src/collector.ts` | The collector. Records C01, C03–C05, C07–C09 fields from interaction events and builds the snapshot. Never stores typed text, names or account numbers. |
| `src/wallet.ts` | Mock wallet: seeded transfer history (C02 transaction context), per-user keys and personal baselines (C06) in local storage. Replace with real wallet state in the product. |
| `App.tsx` | The test screen: transfer flow, all event listeners (web paste/input/composition, back buttons, app state, touches), the Malaysian amount parser (`toMinor`), the privacy leak check and the live field panel. |
| `index.ts`, `app.json`, `package.json`, `tsconfig.json` | Standard Expo project setup (SDK 57). |
| `dist/` | Pre-built static web version. Upload to Netlify/Vercel to test without installing anything. |

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npx expo start --web
```

Open http://localhost:8081. Other devices on the same Wi-Fi can open
`http://<your computer's IP>:8081`.

To rebuild the static version: `npx expo export --platform web` (output in `dist/`).

## Definitions used in testing

These are test values; the data requirements leave them to be agreed.

- Pause threshold: 3 s without interaction
- Recent transfers: last 24 hours
- Usual amount: median of the last 10 transfers
- Baseline available: 5 or more confirmed sessions
- Raw event log: in memory only, capped at 500 events

## How to test

Watch the "Live fields" panel (orange = null / unknown). Use **Reset storage** between runs.

| # | Test | Expect |
| --- | --- | --- |
| 1 | New recipient → type an account number key by key | `C03_editing[0].edit_event_count` rises per key |
| 2 | Paste an account number (Ctrl+V or right-click) | `paste_count` +1, `input_source` = paste |
| 3 | In-app Back, then browser Back | `diag_back_by_source.in_app` and `.browser` each +1 |
| 4 | Wait 5 s without touching, then click | `pause_count` +1 |
| 5 | Switch to another tab for 10 s | `background_duration_ms` ≈ 10000 |
| 6 | Review → Simulate policy warning → I checked → Confirm | All C08 times filled, outcome = confirmed |
| 7 | Switch User A → User B | Different `local_user_key`, empty baseline |
| 8 | Amount `1,200` / `12.345` | `amount_minor_units` = 120000 / null |
| 9 | Privacy leak check → Run | PASS |

Full results: see the "Scam Guardian Data Collectability Test Report".

## Known limits

- Web only was tested (desktop Chrome). Mobile browsers and native builds are untested.
- C09 call state is always null on the web; C10 is not implemented.
- `focus_origin` and `interruption_cause` are always `unknown`; autofill was not observable.
- Refreshing mid-transfer starts a new session and loses the old one's outcome.
- Fields prefixed `diag_` are diagnostics, not model inputs.
