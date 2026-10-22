# Implementation Plan: TLA+-Verified Defensive Concurrency & Optimistic Rollback

## Overview
Implement the defensive concurrency and consistency invariants formally verified by TLA+ and specified in `docs/STATE_CHART.md`. The plan addresses the high-concurrency bugs found by TLC:
1. **Card Position Collisions**: Moving cards within or between lists in SQLite causes duplicate positions when only the moved card is updated.
2. **Unhandled Target List Deletion**: Moving cards into a deleted list causes SQLite foreign key exceptions instead of clean `Result.failure('LIST_NOT_FOUND')`.
3. **Optimistic Desync Without Rollback**: On server rejection or network drop, the client UI keeps cards in the wrong/deleted list indefinitely.
4. **Out-of-Order Stale Reversion**: Rapid successive drags trigger out-of-order server responses, causing UI flicker and stale position overwrites.

All implementations strictly adhere to Milo's architectural rules: vertical feature slices, `Result<T, E>` return discipline, pure calculation in `reorder.calc.ts`, no UI in server layers, max 400 LOC per file, and zero-mock SQLite testing.

---

## Dependency Graph

```
Domain Schema & Service Validation (cards.schema.ts, cards.repo.ts, cards.service.ts)
    │
    ▼
Colocated Server Integration Tests (cards.service.test.ts)
    │
    ▼
Client Monotonic Transaction Sequencer & Snapshot Rollback (board-canvas.tsx)
    │
    ▼
Client Component Verification Tests (board-canvas.test.tsx)
    │
    ▼
Full Mechanical & Architectural Verification Suite (check:arch, check:size, check, knip, test)
```

---

## Vertical Slices

### Phase 1: Server-Side Transactional Positioning & List Invariants
- **Task 1**: Target List Validation & Error Contract (`src/features/cards/cards.service.ts`, `src/features/cards/cards.schema.ts`)
- **Task 2**: Transactional List Reorder & Position Collision Elimination (`src/features/cards/cards.repo.ts`, `src/features/cards/cards.service.ts`)
- **Task 3**: Zero-Mock SQLite Concurrency & Error Tests (`src/features/cards/cards.service.test.ts`)

### Checkpoint: Server Invariants Verified
- [ ] All `cards.service.test.ts` pass with zero mocks against SQLite
- [ ] Position collisions are impossible; destination lists verified before mutation

### Phase 2: Client Monotonic Sequencing & Optimistic Rollback
- **Task 4**: Monotonic Transaction Sequencing in Board Canvas (`src/features/boards/components/board-canvas.tsx`)
- **Task 5**: Defensive Snapshot Rollback on Server Rejection (`src/features/boards/components/board-canvas.tsx`)
- **Task 6**: Client Concurrency & Rollback Unit Tests (`src/features/boards/components/board-canvas.test.tsx`)

### Checkpoint: Client Concurrency Verified
- [ ] `board-canvas.test.tsx` proves optimistic update rollbacks upon server failure
- [ ] Stale out-of-order server action responses are dropped

### Phase 3: System Verification & Guardrail Audit
- **Task 7**: Mechanical Guardrail & Full Test Suite Pass (`bun run check:arch`, `bun run check:size`, `bun run check`, `bun x tsc --noEmit`, `bun run knip`, `bun run test`)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Large transaction payload when moving cards | Low | Lists in Milo typically contain 5-50 cards; bulk position updates in SQLite complete in <2ms. |
| React 19 `useTransition` interacting with optimistic rollback | Med | Store pre-drag snapshot in a mutable ref or functional state update before dispatching the transition. |
| File size violation on `board-canvas.tsx` (>400 LOC) | Med | `board-canvas.tsx` is currently ~230 LOC. Keep changes modular (<70 LOC addition) to remain well below the 400 LOC ceiling. |
