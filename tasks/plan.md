# Implementation Plan: Milo Boards (Tactile Trello Clone MVP)

## Overview
Build Milo, a fast, tactile web-based Kanban board application replicating Trello's core UX using Atlassian Design System tokens. The application enables users to manage Boards, Lists, and Cards with fluid drag-and-drop interactions, optimistic updates, rich card details (labels, checklists, due dates, activity audit log), and zero-mock SQLite testing under strict architectural boundaries (no barrel files, no `utils.ts`, no UI in server layers, max 400 LOC per file).

## Architecture Decisions
- **Next.js App Router & Server Actions**: Internal mutations run via Server Actions in `<domain>.api.ts` validating inputs with Zod schemas from `<domain>.schema.ts`, bypassing manual REST routing and enabling seamless optimistic UI (`useOptimistic`). (ADR 002)
- **Zero Barrel Files**: Root `index.ts` files are strictly banned to prevent circular dependencies, bundle bloat, and slow builds. Direct subpath imports used exclusively (e.g. `@/shared/kernel/result`). (ADR 001)
- **Zero-Mock Ephemeral SQLite Testing**: Integration tests run against an ephemeral SQLite database (`file:test.db`) with real foreign key cascades and transactions, avoiding mock drift. (ADR 003)
- **Repo/Service Split**: In every feature slice (`src/features/<domain>/`), business rules reside in `<domain>.service.ts` returning typed `Result<T, E>`, while Prisma database queries reside in `<domain>.repo.ts`. (ADR 004)
- **Pure Math Isolation**: Card and list reordering arithmetic is isolated in pure function `src/shared/calc/reorder.calc.ts` using spaced integer positions (multiples of 1000).
- **Mechanical Guardrails**: AST boundary scanner (`bun run check:arch`) and file size limiter (`bun run check:size`) prevent architecture erosion and god-files.

## Dependency Graph
```
Tooling & Mechanical Guardrails (package.json, tsconfig, biome, scripts)
    │
    ▼
Prisma Schema & Database Client (prisma/schema.prisma, src/server/db/client.ts)
    │
    ▼
Shared Kernel, Math & Telemetry (primitives, result, reorder.calc, logger)
    │
    ▼
Shared UI Primitives & Atlassian Tokens (tokens, cn.util, button, input, dialog)
    │
    ▼
Feature: Auth & Sessions (crypto session, user repo/service/actions, login/register UI)
    │
    ▼
Feature: Boards & Workspace (boards repo/service/actions, dashboard grid, board header)
    │
    ▼
Feature: Lists & Columns (lists repo/service/actions, list column, add-list input)
    │
    ▼
Feature: Cards Core (cards repo/service/actions, card tile, add-card input)
    │
    ▼
Feature: Drag-and-Drop Board Canvas (@hello-pangea/dnd, board canvas, optimistic sync)
    │
    ▼
Feature: Card Details Modal (dialog, checklist, labels, due dates, presenter)
    │
    ▼
Feature: Activity Audit Stream (transaction logging, activity feed component)
    │
    ▼
Seeding & Final Verification (prisma/seed.ts, check:arch, check:size, tests)
```

## Task List

### Phase 1: Foundation & Guardrails
- [x] Task 1: Project Setup, Config & Mechanical Guardrails (`package.json`, `tsconfig.json`, `biome.json`, `scripts/`)
- [x] Task 2: Database Schema & Client (`prisma/schema.prisma`, `src/server/db/client.ts`)
- [x] Task 3: Shared Kernel, Calculation Math & Telemetry (`src/shared/kernel/`, `src/shared/calc/`, `src/shared/telemetry/`)
- [x] Task 4: Shared UI Primitives & Atlassian Design Tokens (`src/shared/ui/`)

### Checkpoint: Foundation & Guardrails
- [x] TypeScript compiles cleanly
- [x] Unit tests for `reorder.calc` and UI primitives pass
- [x] Architectural linter and file size guard execute cleanly

### Phase 2: Authentication & Session Management (Vertical Slice)
- [x] Task 5: Server Auth Crypto & Session Engine (`src/server/auth/session.ts`, `session.test.ts`)
- [x] Task 6: Auth Domain Backend & Verification (`src/features/auth/auth.{schema,repo,service}.ts`)
- [x] Task 7: Auth Server Actions & Authentication UI (`src/features/auth/auth.api.ts`, login/register pages)

### Checkpoint: Authentication
- [x] User registration, login, and cookie session roundtrip verified in tests
- [x] Protected dashboard route redirects unauthenticated requests

### Phase 3: Boards & Workspace Dashboard (Vertical Slice)
- [x] Task 8: Boards Domain Backend (`src/features/boards/boards.{schema,repo,service}.ts`)
- [x] Task 9: Boards Server Actions & Dashboard Shell (`src/features/boards/boards.api.ts`, dashboard components)

### Checkpoint: Boards & Dashboard
- [x] User can create, list, and view boards
- [x] Board access restrictions enforced by workspace/user ownership

### Phase 4: Lists & Column Management (Vertical Slice)
- [x] Task 10: Lists Domain Backend (`src/features/lists/lists.{schema,repo,service}.ts`)
- [x] Task 11: Lists Server Actions & Column Components (`src/features/lists/lists.api.ts`, list components)

### Checkpoint: Lists Management
- [x] Lists can be added, updated inline, and deleted with cascading card removal

### Phase 5: Cards Core & Quick Add (Vertical Slice)
- [ ] Task 12: Cards Domain Backend (`src/features/cards/cards.{schema,repo,service}.ts`)
- [ ] Task 13: Cards Server Actions & Card Tile Components (`src/features/cards/cards.api.ts`, card components)

### Checkpoint: Cards Management
- [ ] Cards can be added inline to lists and rendered as tactile tiles

### Phase 6: Interactive Drag-and-Drop Board Canvas (Vertical Slice)
- [ ] Task 14: DnD Context & Board Canvas Integration (`@hello-pangea/dnd`, optimistic updates, board route)

### Checkpoint: Board Canvas & DnD
- [ ] Fluid drag-and-drop within and between lists with instant optimistic feedback
- [ ] Positions persisted to SQLite database with spaced ranking (multiples of 1000)

### Phase 7: Card Details Modal — Labels, Checklists, Due Dates (Vertical Slice)
- [ ] Task 15: Card Presenter & Modal Dialog Structure (`cards.presenter.ts`, `card-modal.tsx`)
- [ ] Task 16: Checklist Items, Label Picker & Due Date Components (interactive checklist, color chips, due date badge)

### Checkpoint: Card Details Modal
- [ ] Card modal opens on card click; displays and mutates description, checklists, labels, and due dates
- [ ] Presenter calculates completion percentage and overdue/due-soon status correctly

### Phase 8: Audit Trail & Activity Logging (Vertical Slice)
- [ ] Task 17: Activity Stream & Audit Logging Integration (ActivityLog entries, feed component in modal)

### Checkpoint: Audit Trail
- [ ] All card state changes (move, title edit, checklist toggle) record immutable activity entries
- [ ] Activity stream displays chronological audit history in the card modal

### Phase 9: Seeding, Verification & Final Polish
- [ ] Task 18: Demo Seed Script (`prisma/seed.ts` for instant "Sprint Planning" testing)
- [ ] Task 19: Full Suite Verification & Mechanical Guardrail Pass (all verification commands green)

### Checkpoint: Release Ready
- [ ] Zero TypeScript errors (`tsrs` / `bun x tsc --noEmit`)
- [ ] Zero Biome lint/formatting errors (`bun run check`)
- [ ] Zero architectural violations (`bun run check:arch`)
- [ ] Zero files > 400 LOC (`bun run check:size`)
- [ ] Zero dead code / unused exports (`bun run knip`)
- [ ] 100% tests passing (`bun run test`)
- [ ] Seed script executes cleanly (`bun run seed`)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| `@hello-pangea/dnd` React 18/19 hydration warnings | Med | Encapsulate drag drop in a dedicated client component with proper mounting checks (`dnd-context.tsx`). |
| Optimistic state desync on network failure | Med | Implement snapshot rollback in client state when Server Action returns an error `Result`. |
| Complex SQLite transactions in zero-mock tests | Low | Ephemeral test database created per test suite run using `file:test.db` with automated schema migrations. |
| File size violations (>400 LOC) on rich components | Med | Decompose card modal and canvas into focused subcomponents (`checklist.tsx`, `label-picker.tsx`, `activity-stream.tsx`). |

## Open Questions
- None. Requirements, database schema, design tokens, and architectural boundaries are fully specified in `SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.
