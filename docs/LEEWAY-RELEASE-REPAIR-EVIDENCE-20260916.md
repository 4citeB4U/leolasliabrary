<!-- REGION: LEOLA.EVIDENCE | TAG: RELEASE.REPAIR.20260916
WHAT: inspectable execution checkpoint, not full-product acceptance.
WHO: Creator-authorized Agent Lee; WHY: no claims without evidence.
WHERE: existing Leola release branch; WHEN: 2026-09-16; HOW: source pins and measured results.
LICENSE: MIT. Credentials and customer information are excluded. -->
# Leola release repair evidence

## Authority and scope

- Product repository: `4citeB4U/leolasliabrary`.
- Existing release branch: `leeway/library-entry-v4`.
- Recovered branch base: `edd0d75f2a58ffb250c8dffcd787b356dca55aff`.
- Functional repair head evaluated by the preview deployment: `e7875296367c4394e6f4a50e8462aaafe2e15526`.
- Production main was not changed by this repair. Observed main: `3f041de3bc043862712272987ec517d24162a351`.
- Canonical skills: `4citeB4U/LeeWay-Agent-Skills@66c976bb0e79e24503c847ef90929c6fb9d5d818`.
- Applied workflow sources: Continuity Authority, Context Engineering, Formula Governance, Tool Gateway, Frontend Design binding, Deployment Validator.
- A local skill-session receipt records 11 fetched, SHA-256-hashed authority files under the existing user-local Leola release workspace.
- Constraint: no new plugin installation or account connection. Use existing authorized connections.
- Formula execution: NOT_EXECUTED. No Formula scores or decision hashes are claimed.
- Global C3 completion: NOT_CLOSED by this website repair.

## Native host browser preflight

Actual execution finished at `2026-09-16T23:33:01.882Z` on the authorized Agent-Lee host using Edge `152.0.4191.66`.

Result: **23 passed; zero uncaught browser errors**.

Coverage: entry identity, no microphone before entry, WebGL canvas, caption-only entry, four resource routes, persistent-role greeting, explicitly device-local pass and persistence, voice-entry microphone request, native page turning for both books, top-left reader guide, saved reading positions, exact-text narration dispatch, reduced-motion entry, mobile width, denied-microphone fallback, and unchanged canonical book bytes.

This was the recovered base with local build/test adjustments, before subsequent device-state and payment edits. It is NOT a browser test of every later branch change.

Speech callbacks were explicitly simulated. Microphone media was synthetic. No person was recorded. Audible voice quality, model inference, five-game completion, avatar walking and cloud membership were NOT established by these tests.

Preserved book SHA-256:

- `d6jq33mv39.html`: `923cc42cfee63e1dd33e26602e41d01262434bf9fd7cc9464ec96a6dbfffc37f`
- `0lbzci75tc.html`: `33e75fa693e8b068a18ac25f3f57b365169edad03a7de5e8e58caae86ac40109`

## Deterministic payment/build tests

Executed with Node `22.16.0` in the isolated working container: `node --test tests/*.test.js`.

Result: **30 passed; 0 failed; 0 skipped**. Stripe was dependency-injected; no network request, real checkout or payment was made by these tests.

Coverage includes exact cents, invalid amounts, invalid body/email, absent credentials, explicit unverified credential status, origin restriction, preflight, unsupported methods, idempotency requirement, untrusted redirect rejection, safe upstream errors, deterministic public output, required books, excluded private/server/test inputs, preservation of nested assets and rejection of unowned output deletion.

Exact tested file identities:

| File | Git blob | SHA-256 |
|---|---|---|
| api/create-donation-session.js | 75ae82c6916bfe71ed3112cee2b52c1de6301e27 | c556311ae56293ab5aa92fc9a4cde84043437a5baba165fccb7a0097642461c0 |
| tests/static-build.cjs | 9abe161e4933d6d02778f5ddf8b0b8b08149378c | 3bb6643921f4a6905a9c6e9479c3b25a3971e01de52d04c6a0cb8d53610c6001 |
| tests/static-build.test.js | 27beafe198cd09a565df5fef8eab8e94a161ebed | 3e831ff37020c7900a2a1258038a10d095669176a586884632cdb844affb9536 |
| tests/payment-contract.test.js | efc814dd803c6a3146e47d78b17fc23843f62c8c | f9a1ec511fb1934cc30b6a1a7c3a0dcacf885c8dc9ca0705d862be74f328ce6e |

## Existing Vercel preview

- Deployment: `dpl_77LF2Fzxu6SSeXTUVJccfwvTqeFE`.
- Commit: `e7875296367c4394e6f4a50e8462aaafe2e15526`.
- Status observed: READY.
- Build output: 130 public files.
- Build manifest SHA-256: `2df0f4a2a3027896c6d9540c9b5acd7bde981d93cc1291e645e6bb9b8b341d01`.
- Build completed in `/vercel/output` in 5 seconds according to deployment logs.
- Deployment completed at `2026-09-16T23:48:34Z`.
- This is a preview, NOT promotion to production or full-product acceptance.

At `2026-09-16T23:49:30Z`, the preview donation API returned HTTP 200 JSON with:

```json
{"stripeConfigured":false,"credentialState":"NOT_CONFIGURED","paymentProcessingVerified":false}
```

The existing Stripe Payment Link was preserved on the support page. A functioning checkout page is not proof of merchant-account authority, settled funds or a working webhook. Dynamic Checkout now returns an explicit configuration error instead of silently replacing a selected amount with that generic link.

## Remaining gates and recovery

- GitHub Actions run `35163883246` at the functional repair head reported failure. Its job `105020519315` returned an empty step list. No CI PASS or specific billing diagnosis is claimed.
- Desktop Commander listed Agent-Lee online but file operations and an explicit ping timed out. A local final payment-file append was unconfirmed. Read back before resuming. Do not blindly repeat appends, discard the workspace or overwrite newer remote changes.
- Local uncommitted device-state edits are not included in the published branch repair and need independent tests before adoption.
- Fully animated Leola, validated crochet hand/tool contact, five finished games, produced instructional videos, cloud membership and live payment processing remain separate incomplete gates.
- Native Learning Ledger: NOT_UPDATED. This file is release evidence, not a fabricated native Ledger/Veritas record.

## Next smallest action

Restore a responsive authorized host adapter, reconcile the isolated local source against this remote branch, rerun browser verification on the exact candidate head, and resolve the empty-step CI failure before production promotion. Reuse the existing skill authority and connections; do not introduce new plugins or accounts.
