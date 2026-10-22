# Milo Boards: Defensive Concurrency & Optimistic Rollback Task List

## Phase 1: Server-Side Transactional Positioning & List Invariants

### Task 1: Target List Validation & Error Contract
**Description:** Guard `moveCardCommand` against invalid or concurrently deleted target lists. Validate that `input.targetListId` exists before executing the card position update transaction, returning a structured `Result.failure('LIST_NOT_FOUND', 'Target list not found')` instead of triggering an unhandled Prisma foreign key constraint exception.

**Acceptance criteria:**
- [x] `moveCardCommand` queries list existence using isolated repo method before or inside transaction.
- [x] Returns `Result.failure('LIST_NOT_FOUND', 'Target list not found')` when the destination list does not exist.
- [x] Returns `Result.failure('CARD_NOT_FOUND', 'Card not found')` when the target card does not exist.
- [x] Returns `Result.success(undefined)` when the card and list are valid.

**Verification:**
- [x] Tests pass: `bun test src/features/cards/cards.service.test.ts`
- [x] Type check succeeds: `bun x tsc --noEmit`

**Dependencies:** None

**Files likely touched:**
- `src/features/cards/cards.service.ts`
- `src/features/cards/cards.repo.ts`

**Estimated scope:** Small (2 files)

---

### Task 2: Transactional List Reorder & Position Collision Elimination
**Description:** Ensure that moving a card within a list or across lists recalculates and persists the positions of all affected cards in the destination list, guaranteeing the `UniquePositions` invariant formally proven in TLA+ (`CardPositioningFixed.tla`). Prevent SQLite position collisions where multiple cards end up with identical position integers.

**Acceptance criteria:**
- [x] `moveCardCommand` calculates spaced positions (multiples of 1000) for all cards in the destination list.
- [x] Card movement and position rebalancing occur within a single atomic Prisma transaction (`db.$transaction`).
- [x] No two cards in the same list share the same position integer after any move operation.
- [x] Moving across lists correctly updates the card's `listId` and shifts destination list positions without creating duplicate ranks.

**Verification:**
- [x] Tests pass: `bun test src/features/cards/cards.service.test.ts`
- [x] Architecture passes: `bun run check:arch`

**Dependencies:** Task 1

**Files likely touched:**
- `src/features/cards/cards.service.ts`
- `src/features/cards/cards.repo.ts`

**Estimated scope:** Small (2 files)

---

### Task 3: Zero-Mock SQLite Concurrency & Error Tests
**Description:** Add colocated zero-mock SQLite integration tests covering concurrent move scenarios, target list deletion edge cases, and position uniqueness invariants.

**Acceptance criteria:**
- [x] Integration test verifies `moveCardCommand` returns `LIST_NOT_FOUND` when moving to a nonexistent/deleted list.
- [x] Integration test verifies all card positions in a list remain unique and strictly ordered (1000, 2000, 3000...) after moving card from start to middle or across lists.
- [x] Activity log entry records `MOVED_CARD` with accurate `fromListId`, `toListId`, and `newPosition`.

**Verification:**
- [x] Tests pass: `bun test src/features/cards/cards.service.test.ts`
- [x] Biome check passes: `bun run check`

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `src/features/cards/cards.service.test.ts`

**Estimated scope:** Small (1 file)

---

## Checkpoint: Server Invariants Verified
- [x] All `cards.service.test.ts` tests execute and pass cleanly against SQLite
- [x] No raw runtime exceptions thrown on list deletion or invalid targets
- [x] `bun run check:arch` and `bun run check:size` pass

---

## Phase 2: Client Monotonic Sequencing & Optimistic Rollback

### Task 4: Monotonic Transaction Sequencing in Board Canvas
**Description:** Implement monotonic transaction sequence tracking in `board-canvas.tsx` for drag-and-drop operations, adhering to the `TransactionSequencing.tla` model. Guard client state against out-of-order server action responses and revalidations during rapid successive card drags.

**Acceptance criteria:**
- [x] Maintain monotonic sequence reference (`txSeqRef`) incremented on each user drag gesture.
- [x] Track last acknowledged sequence ID (`lastAckSeqRef`).
- [x] Discard / ignore stale server action completions where `seqId <= lastAckSeqRef.current`.
- [x] Prevent UI flicker and stale position overwrites when rapid drags resolve out of order.

**Verification:**
- [x] Tests pass: `bun test src/features/boards/components/board-canvas.test.tsx`
- [x] Type check succeeds: `bun x tsc --noEmit`

**Dependencies:** Task 3

**Files likely touched:**
- `src/features/boards/components/board-canvas.tsx`

**Estimated scope:** Small (1 file)

---

### Task 5: Defensive Snapshot Rollback on Server Rejection
**Description:** Implement defensive optimistic rollback in `board-canvas.tsx` adhering to the `OptimisticSyncWithRollback.tla` specification. Capture pre-drag snapshot prior to optimistic state mutation; if `moveCardAction` or `reorderListsAction` returns failure or throws a network error, revert the client state back to the pre-drag snapshot.

**Acceptance criteria:**
- [x] Pre-drag list state snapshot is captured immediately before optimistic mutation.
- [x] Server Action return value is checked for `!result.success`.
- [x] If Server Action fails or throws, client state restores previous lists snapshot.
- [x] Toast / user notification warns the user that the move could not be saved.

**Verification:**
- [x] Tests pass: `bun test src/features/boards/components/board-canvas.test.tsx`
- [x] Architecture check passes: `bun run check:arch`

**Dependencies:** Task 4

**Files likely touched:**
- `src/features/boards/components/board-canvas.tsx`

**Estimated scope:** Small (1 file)

---

### Task 6: Client Concurrency & Rollback Unit Tests
**Description:** Add automated tests in `board-canvas.test.tsx` simulating server action rejections and rapid out-of-order completions to verify that rollback and monotonic sequence guards behave according to specification.

**Acceptance criteria:**
- [x] Test verifies that when `moveCardAction` returns `Result.failure('LIST_NOT_FOUND')`, the dragged card snaps back to its original list and position.
- [x] Test verifies that an older server action response resolving after a newer one does not overwrite the latest card position.

**Verification:**
- [x] Tests pass: `bun test src/features/boards/components/board-canvas.test.tsx`
- [x] File size check: `bun run check:size` verifies `board-canvas.tsx` is < 400 LOC.

**Dependencies:** Task 5

**Files likely touched:**
- `src/features/boards/components/board-canvas.test.tsx`

**Estimated scope:** Small (1 file)

---

## Checkpoint: Client Concurrency Verified
- [x] `board-canvas.test.tsx` passes cleanly
- [x] Rollback and monotonic sequence logic verified
- [x] Architecture linter and file size guard pass cleanly

---

## Phase 3: System Verification & Guardrail Audit

### Task 7: Mechanical Guardrail & Full Test Suite Pass
**Description:** Run all canonical verification commands to ensure zero regressions across layer boundaries, file sizes, types, formatting, and unit/integration tests.

**Acceptance criteria:**
- [ ] `bun run check:arch` passes with zero layer boundary violations.
- [ ] `bun run check:size` passes with zero files exceeding 400 LOC.
- [ ] `bun run check` passes with zero Biome format or lint warnings.
- [ ] `bun x tsc --noEmit` passes with zero TypeScript diagnostics.
- [ ] `bun run knip` passes with zero orphaned exports or unused dependencies.
- [ ] `bun run test` passes 100% of unit and integration tests.

**Verification:**
- [ ] Run canonical verification commands sequentially.

**Dependencies:** Task 1 through Task 6

**Files likely touched:**
- Whole repository

**Estimated scope:** Small (Verification only)
