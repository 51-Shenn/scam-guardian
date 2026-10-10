# Vercel deployment

Scope: static web version of the existing Expo SDK 57 mock banking app. Android remains a separate Expo target. The frozen model runs in the visitor's browser; no Python runtime, model API, banking backend or Vercel Function is needed. Calls, app switches and family alerts remain simulated. Personalization is deferred.

## Project and settings

Deploy **`D:\Projects\tools\projects\scam-guardian\scam-guardian`**, not its sibling `trustguard-edge` or `testing` folders.

| Vercel setting | Value |
| --- | --- |
| Framework preset | Other |
| Root directory | Directory containing this app's package.json and vercel.json. If the repository itself is this app, use its root; for a parent repository, use this app's relative path. |
| Node.js | 22.x, declared in package.json |
| Install command | npm ci |
| Build command | npm run build:web |
| Output directory | dist |
| Environment variables | None required for this simulated prototype. EXPO_PUBLIC_APP_BUILD is optional public build metadata, never a secret. |

The build regenerates both manuals, exports web only, and checks the resulting routes/assets. Vercel's cleanUrls setting serves demo.html at `/demo` and evidence.html at `/evidence`. Do not add a catch-all rewrite to `/`: this app exports separate HTML for each route.

The existing dependencies and lockfile are used. No Vercel CLI was installed for this preparation. With Git import, Vercel builds the selected repository revision, so local-only changes must reach that revision before it can use them. Publishing/pushing is a separate action, not performed by this preparation.

## Local validation

From the app root:

```sh
npm run lint
npm run typecheck
npm test
npm run build:web
npm run export:platforms
npm run check:vercel
node scripts/preview.mjs dist 4173
```

`build:web` is the Vercel build. `export:platforms` additionally checks Android bundling; it does not require Vercel to build Android. Export success is not a physical-device check. The custom local preview does not emulate Vercel redirects, headers or cloud installation.

## Deploy using the Vercel dashboard

1. Import the app's Git repository into the intended Vercel account/project.
2. Set the root directory as above and confirm Node 22.x. The committed vercel.json defines installation, build and output settings.
3. Deploy the intended revision. Keep the build logs if installation or Metro fails. If dev dependencies were excluded through dashboard settings, restore them: the web exporter needs the build tooling.
4. Use the resulting HTTPS URL to run the smoke checks below. A successful local export alone does not certify a successful Vercel deployment.

If a Vercel CLI is already installed and authorized, run `vercel` from the app root for its normal interactive preview-deployment flow. Do not deploy only the dist folder with this source-build configuration. No authentication, CLI installation, project linking or remote deployment was performed here.

## Hosted smoke checks

| URL / action | Required observation |
| --- | --- |
| `/` | Landing page loads with bundled fonts/art. |
| `/demo`, loaded directly and refreshed | Banking demo loads; does not fall back to the landing page. Refresh starts a new in-memory measurement run. |
| `/evidence`, loaded directly and refreshed | Public authored results and limitations render. |
| `/testing-manual` | All MT01–MT10 cases render; Live demo opens the same HTTPS deployment, not localhost. |
| `/pitch-manual` | Presenter manual and same-origin navigation load. Vercel may canonicalize `.html` links to clean URLs. |
| MT01 then MT02 from testing manual | Scored model prefix appears, actual warning/origin is inspected, and cancellation works. A live miss is retained rather than called a hosting success for accuracy. |
| Download metrics JSON | Browser saves a local file; session summaries contain no recipient/account/amount/message contents. Export before refresh. |
| Unknown path | Returns a missing-page response; not a false successful payment page. |

For live counters, navigate to evidence through the app's **Pitch evidence** button after ending a transfer. Opening another tab does not share the current run. HTTPS clipboard permissions/browser policies can affect the explicit Paste action; use dummy typing as the documented alternative. No call audio, remote app name or message is captured.

## Privacy and upload scope

Only `dist` is served. The CLI's .vercelignore excludes local records/design/reference/native working folders, while explicitly retaining `data/processed/pitch-evidence-v1/summary.json`, an authored public evidence summary imported by the app. It is not a participant-session file. Git import still gives the hosting service access to the connected repository source; .vercelignore is not a replacement for keeping private participant records out of Git.

Vercel serves page/assets and may retain normal hosting access logs. The app's behavior counters and warning reports remain in browser memory and are not sent to a model server. No durable storage, offline-first installation or zero-network guarantee is claimed. Export before reloading; latest-20 retention and all detection limitations remain.

## References

Preparation verification on 10 October 2026: lint, type checking and all 78 domain tests passed. The Vercel web build passed, including manual generation and post-build checks for six direct HTML pages, ten distinct local asset/link targets and all ten manual case IDs. Android Hermes/web exports and the checker on the combined output passed. Local HTTP checks returned 200 for `/`, `/demo`, `/evidence`, `/testing-manual` and `/pitch-manual`. CLI exclusion patterns retain the imported public summary and exclude example raw/session folders. Model files and summary are tracked; Linux x64 Lightning CSS/Tailwind optional packages are recorded in the lockfile. The initial Windows sandbox asset-write failure was resolved by the authorized retry; no dependency change/download was needed.

No Vercel cloud installation/deployment, hosted browser smoke check, new manual participant test or physical Android test was performed. No public URL is claimed. Local reachability does not validate Vercel's canonical redirects or missing-path response.

- [Expo: publishing websites](https://docs.expo.dev/guides/publishing-websites/) — static export and third-party hosting.
- [Vercel: project configuration](https://vercel.com/docs/project-configuration/vercel-json) — build/output settings and clean URLs.
- [Vercel: supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) — engines selects the supported major.
- [Vercel: .vercelignore](https://vercel.com/docs/deployments/vercel-ignore) — CLI upload exclusions.
