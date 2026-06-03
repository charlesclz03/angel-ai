# Angel AI TWA Store Readiness

Purpose:

- turn the Bubblewrap build path into a concrete Android launch checklist

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- local TWA validation and Play submission readiness

Last updated:

- 2026-03-28

Related docs:

- `.agent/scripts/build-twa.md`
- `scripts/validate-twa.mjs`
- `public/.well-known/assetlinks.json`
- `docs/runbooks/deploy.md`

## Local Build Checklist

- run `npm run twa:check` and keep it green before opening Bubblewrap
- Bubblewrap CLI installed and `bubblewrap doctor` clean
- Android SDK and JDK paths resolved
- `public/manifest.json` includes installable icons that exist on disk
- `public/sw.js` is present and current
- production manifest reachable from the target domain
- keystore created and backed up
- `assetlinks.json` matches the signing certificate SHA256

## Device Validation Checklist

- install the generated `.apk` or `.aab` test build on Android
- confirm the browser URL bar disappears after asset links verify
- confirm Google auth returns to the TWA correctly
- confirm Stripe checkout opens and returns to `/chat`
- confirm push permission, app-level enable or pause, delivery, and notification click behavior work
- confirm quiet hours defer overnight touchpoint delivery until the device becomes eligible again
- confirm continuity read-only state and subscriber state both render correctly

## Play Submission Pack

- signed `.aab`
- application id and keystore metadata
- privacy policy URL
- screenshots and listing copy
- notes describing the app as a communications and wellness companion, not a dating app

## Current Blockers

- the final Bubblewrap compile still needs to be run against the production domain
- production-domain asset-links verification still needs to be confirmed outside local validation
- the Play Console upload and listing setup require external console access
