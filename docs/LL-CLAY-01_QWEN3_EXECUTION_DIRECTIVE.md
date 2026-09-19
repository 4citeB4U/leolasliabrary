# LL-CLAY-01 — Qwen3 Autonomous Completion Directive

## Authority
Creator/Human Authority > LeeWay Standards > LeeWay Agent Skills > Agent Lee/Qwen3 worker > implementation > Veritas > receipt.

Canonical Agent Skills: `4citeB4U/LeeWay-Agent-Skills`.
Canonical application repository: `4citeB4U/leolasliabrary`.
Production branch: `main`.
Current final integration branch: `leeway/ll-clay-01-final`.
Recovered production baseline before final branch: `fd46b1d436274ae0f4f7f1f6404e9faa37b9bf80`.
Current integration head at directive creation: `94f6ee9a9fa4c4b5864cc93388d05b960ebfb0e4`.

FORMULA_EVALUATOR_STATE = UNEXPOSED unless an actual authorized evaluator is separately proven.
FORMULA_EXECUTION_STATE = NOT_EXECUTED unless actual evaluator execution is separately proven.

## Mission
Finish the actual Leola's Learning Library implementation. Do not return another plan, mockup, ZIP-only handoff, or local-only completion report.

Required endpoint:
canonical source + immersive clay world + working interactions + five exercised games + actual lesson media gates + approved Sista Lee voice gate + mobile/desktop QA + GitHub integration + deployment + live Veritas + evidence.

## Operating law
INVESTIGATE → DIAGNOSE → PLAN LOCALLY → IMPLEMENT → TEST → VALIDATE → REPAIR → RETEST → VERIFY → EVIDENCE.

Do not stop for routine clarification. Use the newest Creator direction and existing source evidence. Ask only when a truly non-derivable destructive/security decision is required. A failure is a repair trigger, not completion.

Never convert planned → executed, generated → integrated, committed → deployed, running → healthy, or local → production without evidence.

## Critical corrections to the draft blueprint

1. **Do not treat `Leolas_Library_Magic_Desk.html` as canonical source.** It is historical/prototype evidence only. Start from the actual integration branch and compare it against current `main`.
2. **Hybrid routes are correct.** Keep `index.html` as the continuous entrance/library world; retain `reader.html`, `training.html`, and `game-house.html?room=...` as dedicated activity routes that visually remain inside one clay world.
3. **View Transition API is progressive enhancement, not a hard browser dependency.** Use same-origin view transitions where supported; provide CSS/no-flash fallback and preserve functionality on browsers without it.
4. **IndexedDB may become the durable device-state store, but existing valid guest progress must be migrated rather than silently discarded.** Provide a versioned state schema and migration from current localStorage keys where present.
5. **Cloud membership may remain unconfigured for this release, but never fake registration.** Device guest state must be labeled device-only.
6. **The approved woman’s recording remains the target Sista Lee voice.** Do not replace it silently with a generic device voice and declare the voice gate complete. A device voice may be an explicitly labeled temporary fallback only. If cloning/runtime cannot be verified, captions remain functional and G18 stays open/BLOCKED.
7. **Instructional videos are not waived.** Placeholders are allowed only while building. Final completion requires actual verified playable lesson media for the accepted lesson scope. Never mark a script, still frame, or broken player as a finished video.
8. **Five covers are not five finished games.** Exercise Loop Lab, Tension Tower, Pattern Quest, Amigurumi Rescue, and Yarnfolk Studio through load/start/input/progress/score/undo-or-retry/complete/reset/touch/return.
9. **Sista Lee is one identity only.** Use the approved clay Sista Lee artwork/rig. Remove competing old avatar references and rectangular agent-card presentation.
10. **No generic SaaS downgrade.** HTML remains semantic/accessibility infrastructure; visible controls, cards, forms, dialogs, loading states, and errors must belong to the clay set.

## Required architecture

### Route 1 — index.html
Continuous visitor journey:
OUTSIDE → APPROACH → GLASS DOORS → INTERIOR → SISTA LEE DESK → ENROLLMENT/GUEST CARD → CARD HANDOFF → EXPLORATION → BOOK HANDOFF → READING TABLE.

Sista Lee remains at the desk in the entrance world. Her speech bubble is live, anchored to her scene position, and disappears when dialogue ends.

### Route 2 — reader.html?book=story|instruction
Preserve the two canonical book sources and page-fold behavior. Clay reader shell only. Small circular upper-body clay Sista Lee at top-right, outside text/page controls. Manual page turn interrupts narration. Bookmark/page state persists.

### Route 3 — training.html
Clay course shell. Actual playable verified lesson video when available; truthful clay placeholder otherwise during development. Video viewing != mastery. Deep-link practice to the relevant Game House room.

### Route 4 — game-house.html?room=loop|tension|pattern|amigurumi|yarnfolk
One Game House shell, five rooms, exact approved covers. Shared input layer for keyboard/touch. Each room keeps independent persistent state. All Five Games returns to selector. Back to Desk returns to index and restores visitor context.

## State core
Implement a versioned device-state module, preferably `js/state-manager.js`, using IndexedDB with graceful fallback. Use BroadcastChannel only as an enhancement.

Minimum state:
- schemaVersion
- visitor guest card
- current location/route
- selected/carrying book
- reading page/bookmark
- lesson progress
- five per-room game records
- settings: sound, reduced motion, captions
- timestamps and migration version

Migrate existing known localStorage state where valid. Do not persist secrets or private voice source.

## Sista Lee dialogue FSM
States:
idle | speaking | interrupted | captions | listening | error_recovery.

Dialogue events must cover at least:
arrival, door approach, entry, first greeting, returning visitor, enrollment, card preparing, card handoff, book selection, book handoff, walk-to-seat, sit/read, page change, lesson selection, game selection, incorrect move, accepted move, game completion, return-to-desk, media error, microphone denial.

One speech owner only. New activity cancels prior output. `aria-live="polite"`. Reduced motion snaps rather than animates.

## Object FSMs

Library card:
not_issued → preparing → presenting → handed_over → saved.

Books:
on_shelf → selected → offered → carrying → placed_on_table → open.

Do not route to reader until the relevant handoff/placement path completes, except explicit accessibility/direct-access fallback.

## Mobile/accessibility hard gates
- first focusable control is Skip entrance
- minimum 48×48 CSS px interactive hit targets
- no horizontal overflow
- responsive canvas via ResizeObserver
- no overlapping onboarding/speech/card panels
- keyboard path for every main action
- focus trap for modal card/book interactions
- microphone denial never blocks entry
- reduced motion preserves full feature access
- visible focus indicators
- semantic labels and captions

## Visual law
The entire visitor-facing application must read as one handcrafted clay miniature world:
sculpted surfaces, soft imperfect edges, clay books/furniture/signs, physical depth, warm cinematic lighting, consistent perspective, tactile controls.

Do not solve claymation by recoloring ordinary panels brown. CSS supports the art; it is not the art.

Use the Creator-approved exterior, interior, Sista Lee, library-card, book and five game-cover assets already present or explicitly approved. Do not casually regenerate identity assets.

## Four bounded workers
Use four real workers when the local LeeWay runtime supports them:
1. Canonical Source + Deployment
2. Clay Art + World
3. Experience + Interaction
4. Veritas/QA

Workers may be retooled and reassigned. The lead integrates. No worker self-certifies final acceptance.

If worker runtime is temporarily unavailable, record BLOCKED and continue independent non-conflicting work. Do not substitute unrelated plugin services.

## Chunk gates

C0 canonical authority
C1 critical asset/404 repair
C2 clay visual bible
C3 exterior
C4 glass-door entrance
C5 interior
C6 Sista Lee desk/onboarding
C7 library card
C8 navigation/books/reading
C9 five Game House rooms
C10 voice/media
C11 mobile QA
C12 performance
C13 integrated local Veritas
C14 reviewed GitHub commit/push
C15 GitHub Pages deployment
C16 live production Veritas
C17 independent final audit

A failed chunk reopens only that dependency chain. Continue other independent chunks.

## Deployment law
Do not merge to `main` merely because source looks better.

Before merge:
- inspect diff
- syntax/build tests
- no critical asset 404s in built output
- browser smoke
- mobile and desktop screenshots
- books preserved
- game routes checked
- no private voice/reference file in public artifact
- rollback SHA recorded

After merge:
- verify remote main SHA
- verify GitHub Pages deployment state
- open actual public URL
- verify deployed commit/source
- scan critical requests and console
- capture live screenshots
- exercise end-to-end visitor flow

GitHub Actions billing/runner failures are deployment evidence, not permission to call a failed workflow PASS. If Pages legacy branch publishing is the configured route, verify that exact mechanism.

## Completion checklist
Do not say COMPLETE until all are evidence-backed:

[ ] canonical repository/branch/deployed commit proven
[ ] four LeeWay subagents executed where runtime supports them
[ ] critical images/styles/scripts return successfully
[ ] coherent clay visual language
[ ] exterior clay scene
[ ] door sequence
[ ] interior clay scene
[ ] one clay Sista Lee identity
[ ] enrollment/guest-card truth
[ ] clay card handoff/persistence
[ ] both books and page folding
[ ] book handoff/carry/seat path
[ ] video route with accepted real media scope
[ ] five exact game covers
[ ] five games exercised
[ ] mobile QA
[ ] desktop QA
[ ] reduced-motion/accessibility path
[ ] no critical JS errors/404s
[ ] reviewed commit and remote push
[ ] Pages deployment
[ ] public-site Veritas
[ ] independent final audit
[ ] truthful receipts/ledger

## Final reporting
Return progress as:
MASTER CHECKPOINT
CHUNK STATUS
WORKERS
IMPLEMENTED
TESTS
FAILURES / REPAIRS
LIVE VERITAS
RECEIPTS
REMAINING FAILED GATE

Do not ask, “Should I proceed?” The Creator already approved execution.

Do the work.
