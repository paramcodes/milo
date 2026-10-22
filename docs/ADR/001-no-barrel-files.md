# ADR 001: Ban Root Barrel Files

## Context
Root `index.ts` files that re-export an entire directory tree cause circular dependency traps, slow down TypeScript compilation, cause token waste when agents inspect folders, and bloat client bundle sizes.

## Decision
Ban all root barrel `index.ts` files. All internal and cross-folder imports must use explicit subpath imports (e.g. `@/shared/kernel/result` or `@/features/cards/cards.schema`).

## Consequences
- Clean, direct dependency tracking.
- Faster `tsrs` and `tsc` builds.
- Zero circular import hazards.
