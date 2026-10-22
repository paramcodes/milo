# SPEC: Trello Clone MVP ("Milo Boards")

## 1. Objective & Target Users

### Objective
Build a fast, tactile web-based Kanban board application replicating Trello's core UX and Atlassian Design System tokens. It enables teams and individuals to organize projects across Boards, Lists, and Cards with fluid drag-and-drop interactions, rich card details (labels, checklists, due dates, activity log), and a strictly governed, agent-friendly architecture with zero ambiguity.

### Target Users
- Small teams and individuals needing an intuitive, low-friction Kanban tool.
- Users expecting Trello-grade tactile responsiveness (instant drag-and-drop, inline editing, quick card creation).

### Core Acceptance Criteria
1. **Lightweight Auth & Identity**: Session management via signed HTTP-only cookies, password hashing with Web Crypto / scrypt, workspace access checks.
2. **Board Canvas**: Horizontal scrolling board view styled with Atlassian Design System color tokens.
3. **List Operations**: Create list, inline title edit, delete list, horizontal reordering of lists via drag-and-drop.
4. **Card Operations**: Quick-add card inline, inline title edit, vertical reordering within a list, and moving cards across lists via drag-and-drop.
5. **Card Details Modal**: Rich dialog containing:
   - Card title & description
   - Color-coded labels
   - Checklist with progress indicator (checkboxes that toggle completion)
   - Due date picker with status (overdue, due soon, complete)
   - Real-time audit / activity stream (records who moved/created/checked items)
6. **Optimistic Updates**: Client updates canvas state immediately on drag or edit, syncing via Next.js Server Actions in the background with rollback on failure.
7. **Database Seeding**: `bun run seed` script pre-populating a demo team and a populated "Sprint Planning" board for instant local testing.

---

## 2. Inviolable Architectural Rules & Invariants

1. **No UI in API/Server Folders**: `.tsx` files, React components, hooks, and styling tokens must **never** exist inside `api/`, `server/`, or `db/` directories.
2. **No Generic `lib/` or `utils.ts`**: The `lib/` folder is eliminated. Logic is categorized into explicit shared layers:
   - `src/shared/kernel/`: Core result types (`result.ts`) and branded primitives (`primitives.ts`).
   - `src/shared/calc/`: Pure mathematical calculation functions (`reorder.calc.ts`).
   - `src/shared/ui/`: Design tokens (`atlassian-tokens.ts`), class merger (`cn.util.ts`), and UI primitives.
   - `src/shared/telemetry/`: Structured JSON logger (`logger.ts`). Raw `console.log` is strictly banned.
   - The filename `utils.ts` is strictly **banned**.
3. **No Monolithic Barrel Files**: Root `index.ts` re-export barrels are banned. Imports must use direct subpaths (e.g. `@/shared/kernel/result`, `@/features/cards/cards.schema`) to eliminate circular dependencies, prevent token waste, and accelerate compilation.
4. **Vertical Feature Slices with Repo/Service Separation**: Domain capabilities are grouped strictly under `src/features/<domain>/` where:
   - `AGENTS.md`: Scoped micro-rules for that specific domain.
   - `<domain>.schema.ts`: Zod validation schemas, inferred types, and DTOs.
   - `<domain>.presenter.ts`: Pure view-model data transformations for UI rendering.
   - `<domain>.service.ts`: Pure domain business logic, CQRS, and activity logging (no raw SQL/Prisma).
   - `<domain>.repo.ts`: Isolated Prisma database operations for that domain.
   - `<domain>.api.ts`: Next.js Server Actions (`'use server'`) validating inputs and calling services.
   - `components/`: Domain-specific React components and colocated tests.
5. **CQRS in Services**: Read queries (for Server Components) are strictly grouped separately from write commands (mutations with business logic, transactions, and audit logs).
6. **Strict `Result<T, E>` Return Discipline**: Domain services never throw raw runtime exceptions for expected business failures (e.g., `CardNotFound`, `Unauthorized`, `InvalidPosition`). They always return typed `Result.success(data)` or `Result.failure(error)`.
7. **Colocated Zero-Mock Verification**: Unit tests (`*.test.ts`, `*.test.tsx`) are colocated. Service integration tests run against a real ephemeral SQLite database (`file:test.db`) with zero mocks.
8. **Automated Mechanical Guardrails**:
   - `bun run check:arch`: AST import scanner enforcing layer boundaries (`scripts/lint-architecture.ts`).
   - `bun run check:size`: Fails if any file > 400 lines (`scripts/check-file-size.ts`).
   - `bun run knip`: AST scanner detecting dead code, unused exports, and orphaned dependencies.
9. **Progressive Disclosure Memory (`docs/` & `AGENTS.md`)**:
   - Root `AGENTS.md` is an ultra-lean router (<80 lines).
   - Root `CLAUDE.md` is a 1-line pointer (`@AGENTS.md`).
   - Deep on-demand memory lives in `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.

---

## 3. Complete Project Directory Layout (Line 1 to End)

```
milo/
├── CLAUDE.md                              # [1-LINE POINTER] Contains literally: "@AGENTS.md"
├── AGENTS.md                              # [ROOT ROUTER: <80 LOC] Commands, pointer table & core rules
├── SPEC.md                                # Master system specification
├── knip.json                              # Dead-code & unused-dependency AST scanner
├── biome.json                             # Biome linter & formatter configuration
├── lefthook.yml                           # Git pre-commit & pre-push hooks
├── package.json                           # Scripts: check:arch, check:size, test, knip, etc.
├── tsconfig.json                          # Strict compiler configuration
├── prisma/
│   ├── schema.prisma                      # Canonical database schema
│   ├── seed.ts                            # Demo team & board seeder (`bun run seed`)
│   └── migrations/                        # SQLite migrations
├── docs/                                  # [ON-DEMAND AGENT MEMORY]
│   ├── ARCHITECTURE.md                    # System topology, layer rules, and error codes
│   ├── DB_SCHEMA.md                       # Condensed ERD & table invariants
│   └── ADR/                               # Architecture Decision Records
│       ├── 001-no-barrel-files.md
│       ├── 002-server-actions-over-rest.md
│       ├── 003-ephemeral-sqlite-testing.md
│       └── 004-repo-service-split.md
├── scripts/                               # [SELF-HEALING GUARDRAILS]
│   ├── lint-architecture.ts               # AST boundary checker emitting remediation instructions
│   └── check-file-size.ts                 # Fails if any file > 400 lines
└── src/
    ├── app/                               # NEXT.JS ROUTING & PAGES (Thin shells only)
    │   ├── layout.tsx                     # Root layout & font provider
    │   ├── globals.css                    # Atlassian theme CSS variables
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx               # Renders <LoginForm />
    │   │   └── register/
    │   │       └── page.tsx               # Renders <RegisterForm />
    │   └── (dashboard)/
    │       ├── layout.tsx                 # Dashboard shell navigation & user menu
    │       ├── page.tsx                   # Renders <BoardsDashboard />
    │       └── b/
    │           └── [boardId]/
    │               └── page.tsx           # Fetches getBoard query, renders <BoardCanvas />
    ├── server/                            # BACKEND INFRASTRUCTURE (Server-only, NO .tsx)
    │   ├── db/
    │   │   └── client.ts                  # Singleton Prisma client instance
    │   └── auth/
    │       ├── session.ts                 # Cookie session encryption & signature verification
    │       └── session.test.ts            # Colocated session crypto test
    ├── shared/                            # SHARED INFRASTRUCTURE & KERNEL
    │   ├── AGENTS.md                      # Scoped rules: "Zero feature imports allowed inside shared/"
    │   ├── kernel/                        # ZERO-DEPENDENCY CORE TYPES
    │   │   ├── primitives.ts              # Branded IDs (BoardId, CardId, ListId, UserId)
    │   │   └── result.ts                  # Result<T, E> error contract
    │   ├── calc/                          # PURE MATHEMATICAL FUNCTIONS
    │   │   ├── reorder.calc.ts            # Position reordering algorithm
    │   │   └── reorder.calc.test.ts       # Colocated 100% pure math unit test
    │   ├── telemetry/                     # STRUCTURED LOGGING
    │   │   └── logger.ts                  # JSON logger (raw console.log banned)
    │   └── ui/                            # DESIGN SYSTEM PRIMITIVES (Zero domain logic)
    │       ├── atlassian-tokens.ts        # Atlassian color constants & hex tokens
    │       ├── cn.util.ts                 # Classnames merge utility (banned: utils.ts)
    │       ├── button.tsx                 # Headless / shadcn button primitive
    │       ├── button.test.tsx            # Colocated button test
    │       ├── dialog.tsx                 # Radix dialog primitive
    │       ├── popover.tsx                # Radix popover primitive
    │       ├── input.tsx                  # Styled input primitive
    │       └── badge.tsx                  # Trello label chip primitive
    └── features/                          # VERTICAL FEATURE SLICES
        ├── auth/                          # IDENTITY & SESSION FEATURE
        │   ├── AGENTS.md                  # Scoped rules: "Never log passwords; use Web Crypto"
        │   ├── auth.schema.ts             # Login/Register Zod schemas & types
        │   ├── auth.service.ts            # Business logic & session coordination
        │   ├── auth.repo.ts               # Isolated database queries for user & session
        │   ├── auth.service.test.ts       # Colocated auth integration test
        │   ├── auth.api.ts                # Server Actions (loginAction, registerAction, logoutAction)
        │   └── components/
        │       ├── login-form.tsx         # Interactive login form
        │       └── register-form.tsx      # Interactive register form
        ├── boards/                        # BOARD WORKSPACE FEATURE
        │   ├── AGENTS.md                  # Scoped rules: "Enforce workspace ownership before mutating"
        │   ├── boards.schema.ts           # Board DTOs & validation schemas
        │   ├── boards.service.ts          # CQRS: Queries & Commands
        │   ├── boards.repo.ts             # Prisma queries for boards & workspace memberships
        │   ├── boards.service.test.ts     # Colocated board service test
        │   ├── boards.api.ts              # Server Actions (createBoardAction, updateBoardAction)
        │   └── components/
        │       ├── boards-dashboard.tsx   # Dashboard grid of user boards
        │       ├── board-header.tsx       # Board title & background changer
        │       ├── board-canvas.tsx       # Horizontal scrolling board canvas
        │       ├── board-canvas.test.tsx  # Colocated canvas component test
        │       └── dnd-context.tsx        # @hello-pangea/dnd context wrapper
        ├── lists/                         # LIST COLUMN FEATURE
        │   ├── AGENTS.md                  # Scoped rules: "Lists belong to boards; cascade deletions"
        │   ├── lists.schema.ts            # List CRUD Zod schemas & types
        │   ├── lists.service.ts           # CQRS: Commands (createList, updateTitle, deleteList)
        │   ├── lists.repo.ts              # Prisma queries for lists
        │   ├── lists.service.test.ts      # Colocated list service test
        │   ├── lists.api.ts               # Server Actions (createListAction, deleteListAction)
        │   └── components/
        │       ├── list-column.tsx        # List container with inline edit
        │       └── add-list-input.tsx     # Quick-add list input
        └── cards/                         # CARD & MODAL FEATURE
            ├── AGENTS.md                  # Scoped rules: "Position math must use reorder.calc.ts"
            ├── cards.schema.ts            # Card, Checklist, and Activity Zod schemas
            ├── cards.presenter.ts         # Pure view-models (checklist progress %, due date status)
            ├── cards.service.ts           # Domain logic & transactions + Activity logging
            ├── cards.repo.ts              # Prisma queries for cards, checklists, and activity log
            ├── cards.service.test.ts      # Colocated card service test (zero-mock SQLite)
            ├── cards.api.ts               # Server Actions (createCardAction, moveCardAction, etc.)
            └── components/
                ├── card-tile.tsx          # Draggable card preview tile
                ├── add-card-input.tsx     # Quick-add card inline input
                ├── card-modal.tsx         # Main card detail dialog
                ├── card-modal.test.tsx    # Colocated modal test
                ├── checklist.tsx          # Checklist items & progress indicator
                ├── label-picker.tsx       # Color palette label selector
                ├── activity-stream.tsx    # History & audit log feed
                └── due-date-badge.tsx     # Visual overdue/due-soon indicator
```

---

## 4. File-Placement & Import Boundary Rules

| Directory Path | Allowed Extensions | Allowed Contents | Allowed Imports | Forbidden Imports / Violations |
|---|---|---|---|---|
| `src/app/` | `.ts`, `.tsx` | Thin Next.js page shells, layouts, CSS | `@/features/*`, `@/shared/*` | Direct database imports (`@/server/db`), raw SQL/Prisma calls |
| `src/server/db/` | `.ts` only | Prisma singleton client (`client.ts`) | `@prisma/client`, `prisma` | **NO `.tsx` files**. No React, no hooks, no UI imports |
| `src/server/auth/` | `.ts` only | Cookie session reading/signing, password crypto | `@/server/db`, `@/shared/kernel/*` | **NO `.tsx` files**. No React components, no UI tokens |
| `src/shared/kernel/` | `.ts` only | Core `Result<T>` type, branded semantic IDs | None (pure zero-dependency core) | **NO `.tsx` files**. No server, database, or feature imports |
| `src/shared/calc/` | `.ts` only | Pure calculation functions (`reorder.calc.ts`) | `@/shared/kernel/*` | **NO `.tsx` files**. No React, no DOM, no DB, zero side-effects |
| `src/shared/telemetry/` | `.ts` only | Structured JSON logger (`logger.ts`) | None | Raw `console.log` is strictly banned |
| `src/shared/ui/` | `.ts`, `.tsx` | Atlassian tokens (`atlassian-tokens.ts`), `cn.util.ts`, Radix UI primitives | `@/shared/kernel/*`, Radix UI, `clsx`, `tailwind-merge` | **Banned filename `utils.ts`**. No feature imports, no database imports |
| `src/features/<d>/<d>.schema.ts` | `.ts` only | Zod schemas, inferred types | `zod`, `@/shared/kernel/*` | **NO `.tsx` files**. No React, no database access |
| `src/features/<d>/<d>.presenter.ts` | `.ts` only | Pure view-model formatters (dates, progress %) | `<d>.schema.ts`, `@/shared/kernel/*` | **NO `.tsx` files**. Pure functions only. No database calls |
| `src/features/<d>/<d>.service.ts` | `.ts` only | Domain business logic, CQRS, and activity logging | `<d>.repo.ts`, `<d>.schema.ts`, `@/shared/kernel/*`, `@/shared/calc/*` | **NO `.tsx` files**. No direct ORM calls (delegates to repo) |
| `src/features/<d>/<d>.repo.ts` | `.ts` only | Isolated Prisma queries for `<domain>` | `@/server/db`, `<d>.schema.ts` | **NO `.tsx` files**. No business rules or validation |
| `src/features/<d>/<d>.api.ts` | `.ts` only | Server Actions (`'use server'`) | `<d>.service.ts`, `<d>.schema.ts`, `@/shared/kernel/*` | **NO `.tsx` files**. No React component rendering |
| `src/features/<d>/components/` | `.tsx`, `.ts` | Domain-specific UI presentation | `<d>.schema.ts`, `<d>.presenter.ts`, `<d>.api.ts`, `@/shared/ui/*`, React | Direct DB imports (`@/server/db`), raw Prisma calls |

---

## 5. Service & Repository Separation Example

```typescript
// src/features/cards/cards.repo.ts (Pure Database Queries)
import { db } from '@/server/db/client';
import type { MoveCardInput } from './cards.schema';

export async function findCardById(cardId: string) {
  return await db.card.findUnique({
    where: { id: cardId },
    include: { checklists: true, labels: true, activities: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function updateCardPositionTx(tx: any, input: MoveCardInput) {
  return await tx.card.update({
    where: { id: input.cardId },
    data: { listId: input.targetListId, position: input.newPosition },
  });
}

export async function createActivityLogTx(tx: any, cardId: string, actorId: string, action: string, details: string) {
  return await tx.activityLog.create({
    data: { cardId, actorId, action, details },
  });
}
```

```typescript
// src/features/cards/cards.service.ts (Domain Logic + Transactions)
import { db } from '@/server/db/client';
import { Result } from '@/shared/kernel/result';
import * as cardsRepo from './cards.repo';
import type { MoveCardInput, CardDto } from './cards.schema';

export async function getCardDetails(cardId: string): Promise<Result<CardDto>> {
  const card = await cardsRepo.findCardById(cardId);
  if (!card) return Result.failure('CARD_NOT_FOUND', 'Card not found');
  return Result.success(card as unknown as CardDto);
}

export async function moveCardCommand(input: MoveCardInput, actorId: string): Promise<Result<void>> {
  return await db.$transaction(async (tx) => {
    const card = await cardsRepo.findCardById(input.cardId);
    if (!card) return Result.failure('CARD_NOT_FOUND', 'Card not found');

    await cardsRepo.updateCardPositionTx(tx, input);
    await cardsRepo.createActivityLogTx(tx, input.cardId, actorId, 'MOVED_CARD', JSON.stringify({
      fromListId: card.listId,
      toListId: input.targetListId,
    }));

    return Result.success(undefined);
  });
}
```

---

## 6. Shared Kernel & Pure Calculation Math

### 6.1 Branded Semantic Primitives (`src/shared/kernel/primitives.ts`)
```typescript
export type UserId = string & { readonly __brand: 'UserId' };
export type BoardId = string & { readonly __brand: 'BoardId' };
export type ListId = string & { readonly __brand: 'ListId' };
export type CardId = string & { readonly __brand: 'CardId' };
export type ChecklistItemId = string & { readonly __brand: 'ChecklistItemId' };
```

### 6.2 Strict Result Contract (`src/shared/kernel/result.ts`)
```typescript
export type Result<T, E = { code: string; message: string; details?: unknown }> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export const Result = {
  success<T>(data: T): Result<T> {
    return { success: true, data };
  },
  failure<T = never>(code: string, message: string, details?: unknown): Result<T> {
    return { success: false, error: { code, message, details } };
  },
};
```

### 6.3 Pure Reorder Math (`src/shared/calc/reorder.calc.ts`)
```typescript
export function calculateReorderedPosition<T extends { id: string; position: number }>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  if (!removed) return items;
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000,
  }));
}
```

---

## 7. Tech Stack & Commands

- **Package Manager & Runtime**: `bun`
- **Framework**: Next.js 14+ (App Router, Server Actions, React 18/19)
- **Language**: TypeScript Strict (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`)
- **Fast Typechecking**: `tsrs` (with `tsc --noEmit` fallback)
- **Styling**: Tailwind CSS + Atlassian Design tokens (`src/shared/ui/atlassian-tokens.ts`)
- **UI Primitives**: Radix UI / headless primitives (`src/shared/ui/`)
- **Drag-and-Drop**: `@hello-pangea/dnd`
- **Database**: SQLite via Prisma ORM (`src/server/db/client.ts`)
- **Validation**: `zod` at Server Action boundaries (`<domain>.schema.ts`)
- **Quality Tooling**:
  - Biome: Linter & Formatter (`bun run check`)
  - Knip: AST Dead-code & orphaned export detector (`bun run knip`)
  - Architecture Linter: AST layer import checker (`bun run check:arch`)
  - File Size Guard: Enforces <400 LOC per file (`bun run check:size`)
  - Lefthook: Pre-commit git hooks
  - Vitest: Test runner with zero-mock SQLite test database

### Commands

```bash
bun install                  # Fast dependency install
bun run dev                  # Start dev server at localhost:3000
bun run build                # Production build
bunx prisma migrate dev      # Run database migrations
bunx prisma generate         # Generate Prisma client
bun run seed                 # Pre-populate sample team & board (prisma/seed.ts)
tsrs                         # Fast Rust-based typecheck
bun run check:arch           # AST architecture & import boundary check
bun run check:size           # Enforce max 400 LOC per file
bun run check                # Run Biome lint & format check
bun run knip                 # Scan for dead code, unused exports & unused dependencies
bun run test                 # Run all colocated unit & component tests (zero-mock SQLite)
bun run test:watch           # Run tests in watch mode
```

---

## 8. Testing Strategy

1. **Colocated Pure Math Tests (`src/shared/calc/reorder.calc.test.ts`)**:
   - 100% test coverage for intra-list card reordering, cross-list card movement, and list horizontal reordering.
2. **Colocated Service Tests (`src/features/*/*.service.test.ts`)**:
   - Zero-mock integration tests against an ephemeral SQLite database (`file:test.db`). Verifies real foreign key cascades, unique constraints, and transaction rollbacks in milliseconds.
3. **Colocated Component Tests (`src/features/*/components/*.test.tsx`, `src/shared/ui/*.test.tsx`)**:
   - Tests user interaction, optimistic drag events, and modal dialog behavior.
4. **Execution**:
   - `bun run test` runs all colocated `*.test.ts` and `*.test.tsx` files across the codebase in parallel with sub-second execution.

---

## 9. Boundaries

### Always Do
- Follow the File-Placement Table in `AGENTS.md` and `SPEC.md` strictly.
- Keep `.tsx` files strictly inside `components/`, `shared/ui/`, or `src/app/`.
- Import directly from subpaths (e.g. `@/shared/kernel/result`); never create root `index.ts` barrel files.
- Return `Result<T>` from services for business outcomes; avoid throwing untyped runtime exceptions.
- Separate business rules in `<domain>.service.ts` from database calls in `<domain>.repo.ts`.
- Use branded types (`BoardId`, `CardId`, `ListId`, `UserId`) for all entity IDs.
- Validate inputs in `<domain>.api.ts` using `<domain>.schema.ts`.
- Run `tsrs`, `bun run check:arch`, `bun run check:size`, `bun run check`, and `bun run knip` before committing.

### Ask First
- Adding external runtime packages outside the approved list.
- Modifying Prisma database models or migration structure.
- Adding a new feature folder under `src/features/`.

### Never Do
- Never put UI components, `.tsx` files, or hooks in `src/server/`, `api/`, or `db/`.
- Never create or use a generic `lib/` directory or a file named `utils.ts`.
- Never create monolithic barrel files (`index.ts` re-exporting multiple files).
- Never use raw `console.log` (use `@/shared/telemetry/logger`).
- Never write Prisma database queries inside client components in `src/features/*/components/` or `src/app/`.
- Never create a separate, detached `tests/` directory for unit tests.
- Never use `any` or `@ts-ignore`.
- Never allow any file to exceed 400 lines of code.

---

## 10. Success Criteria

- [ ] Repository strictly follows the architectural invariants with root `AGENTS.md` (<80 LOC) and 1-line `CLAUDE.md`.
- [ ] On-demand memory established in `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.
- [ ] Self-healing mechanical guards in `scripts/` (`lint-architecture.ts`, `check-file-size.ts`).
- [ ] No `.tsx` or UI components in `server/`, no generic `lib/` or `utils.ts`, no root barrel files, no raw `console.log`.
- [ ] Vertical feature slices (`auth`, `boards`, `lists`, `cards`) cleanly separated into `.schema.ts`, `.presenter.ts`, `.service.ts`, `.repo.ts`, `.api.ts`, and `components/`.
- [ ] Base design system primitives in `src/shared/ui/` styled with Atlassian tokens.
- [ ] Lightweight cookie-based authentication functioning with protected routes.
- [ ] Smooth drag-and-drop for cards within and across lists with instant optimistic updates and persistent reordering.
- [ ] Full card modal with working description editor, color labels, checklist, and due dates.
- [ ] Real-time card activity stream logged on mutations and displayed in the modal.
- [ ] Database seed script (`bun run seed`) boots a full working board for instant testing.
- [ ] Zero-mock colocated unit and integration tests passing.
- [ ] Zero TypeScript errors (`tsrs`), zero Biome issues, zero Knip warnings (`bun run knip`), zero architectural violations (`bun run check:arch`), and zero files > 400 lines (`bun run check:size`).
