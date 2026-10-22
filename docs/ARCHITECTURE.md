# Architecture & Topology

## 1. System Topology
Milo is a modular, single-binary, full-stack Next.js application designed with Vertical Feature Slices and Clean Layer boundaries:

```
[ Next.js App Router (src/app/) ]
               │
               ▼
[ Features (src/features/<domain>/) ]
  ├── components/   --> React UI & optimistic interaction
  ├── <d>.api.ts    --> Server Actions (Input validation boundary)
  ├── <d>.service.ts--> Pure domain rules & transaction coordination
  └── <d>.repo.ts   --> Isolated Prisma database queries
               │
        ┌──────┴──────────────────────────┐
        ▼                                 ▼
[ Shared Infrastructure ]       [ Database (SQLite / Prisma) ]
  ├── shared/kernel/              ├── src/server/db/client.ts
  ├── shared/calc/                └── prisma/schema.prisma
  ├── shared/ui/
  └── shared/telemetry/
```

## 2. Layer Invariants
1. **Unidirectional Dependency Flow**:
   - `app` imports `features` and `shared`.
   - `features` import `shared` and `server/db`. Features do **NOT** cross-import private internals from other features.
   - `shared` imports **nothing** from `features` or `server`.
2. **Pure Math Isolation**:
   - All drag-and-drop index calculations reside in `src/shared/calc/reorder.calc.ts`.
3. **Structured Errors (`Result<T, E>`)**:
   - No untyped thrown errors. All operations return `Result.success(data)` or `Result.failure(code, message)`.
