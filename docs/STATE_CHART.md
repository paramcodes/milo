# Board & Card Synchronization State Chart

This state chart documents the interactive lifecycle, optimistic updates, concurrency race conditions, and error recovery states of the Milo Kanban board application.

![Milo State Chart](./assets/state-chart.svg)

---

## 1. Visual Legend

| State Badge | Meaning |
|---|---|
| **Works** (Neutral Gray) | Expected nominal flow adhering to pure domain invariants and optimistic UI transitions. |
| **Bug TLA+ Found** (Red) | High-concurrency desynchronization, unhandled optimistic rollback, or state-machine race condition. |
| **Fixed** (Green) | The defensive invariant, monotonic version check, or rollback mechanism preventing corruption. |

---

## 2. Core Interactive Lifecycles

### A. Horizontal List Reordering (`ListColumn`)
1. **User Gesture**: Dragging a column horizontally across the board.
2. **Optimistic Mutation**: Client updates list state immediately via `calculateReorderedPosition` (`reorder.calc.ts`), assigning new 1000-based indexes.
3. **Persistence Boundary**: `reorderListsAction` dispatches list IDs to the server action layer.
4. **Failure Recovery**: If network drops or SQLite write encounters a lock, the client state must revert to the pre-drag snapshot and surface an Atlassian warning toast.

### B. Tactile Card Drag & Drop (`BoardCanvas` & `CardTile`)
1. **Movement Matrix**:
   - **Dropped outside / same index**: Instantly snaps back to origin with zero network overhead.
   - **Within same list**: Recalculates index using 1000-based positions. Dispatches `moveCardAction`.
   - **Across different lists**: Splices card from `sourceList.cards` into `destList.cards`, recalculates destination sparse positions, and dispatches `moveCardAction` with `targetListId`.
2. **Concurrency Invariants**:
   - **Server Rejection / 401**: Optimistic rollback reverts the dragged card to its original index and list.
   - **Rapid Successive Drags**: Monotonic transaction sequence IDs drop stale server revalidations from earlier drags, preventing UI flicker.
   - **Concurrent List Deletion**: If another user deletes the destination list mid-drag, the server returns `ListNotFound`, triggering optimistic reconciliation back into the source list.

### C. Card Details Modal & Rich Metadata (`CardModal`)
1. **Inline Title & Description**:
   - Blur event triggers background `updateCardAction`.
   - Empty title strings safely short-circuit and revert to the previous title without dispatching network calls.
2. **Checklist Progress Bar**:
   - `calculateChecklistProgress` recalculates percentage dynamically.
   - Reaching 100% transitions progress bar to Atlassian green (`#00875A`).
   - Rapid clicking is guarded by item-level optimistic locks to avoid SQLite concurrent write locks (`SQLITE_BUSY`).
3. **Due Date & Completion State Machine**:
   - Evaluated by `getDueDateStatus(dueDate, isCompleted)` in `cards.presenter.ts`.
   - `isCompleted === true` takes strict precedence: even if the due date is in the past, the card badge remains green (`COMPLETE`) rather than erroneously flipping to red (`OVERDUE`).

---

## 3. Regenerating the Diagram

The state chart SVG and high-resolution PNG are generated deterministically:

```bash
bun run scripts/generate-state-chart.ts
```
