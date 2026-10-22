# Formal Verification (TLA+ / TLC)

Formal verification models for Milo's core concurrency, ordering, and optimistic synchronization mechanisms.

## Model Summary

| Spec | Track | Target Invariants | Result |
|---|---|---|---|
| `CardPositioning.tla` | Track B (Algorithmic / DB Invariants) | `UniquePositions` | **Violated**: Single-card update leaves duplicate positions in SQLite |
| `CardPositioningFixed.tla` | Track B (Algorithmic / DB Invariants) | `UniquePositions`, `OrderConsistent` | **Verified**: Transactional batch reorder satisfies invariant across all 30 reachable states |
| `OptimisticSyncNoRollback.tla` | Track A (Concurrent State Machine) | `RollbackPreservesOriginOnFailure` | **Violated**: Concurrent destination list deletion leaves orphan card on client |
| `OptimisticSyncWithRollback.tla` | Track A (Concurrent State Machine) | `RollbackPreservesOriginOnFailure` | **Verified**: Snapshot rollback restores consistency upon server error |
| `TransactionSequencing.tla` (No Guard) | Track A (Out-of-Order Network Messages) | `NoStaleOverwrite` | **Violated**: Late response from earlier drag overwrites newer position |
| `TransactionSequencing.tla` (With Guard) | Track A (Out-of-Order Network Messages) | `NoStaleOverwrite` | **Verified**: Monotonic sequence guard drops stale responses |

## Running the Specs

Requires `tla2tools.jar`:

```bash
# 1. Card positioning collision check
java -cp /tmp/tla2tools.jar tlc2.TLC CardPositioning.tla

# 2. Verified transactional positioning
java -cp /tmp/tla2tools.jar tlc2.TLC CardPositioningFixed.tla

# 3. Optimistic rollback verification
java -cp /tmp/tla2tools.jar tlc2.TLC OptimisticSyncWithRollback.tla

# 4. Monotonic transaction sequencing check
java -cp /tmp/tla2tools.jar tlc2.TLC -config TransactionSequencingWithGuard.cfg TransactionSequencing.tla
```
