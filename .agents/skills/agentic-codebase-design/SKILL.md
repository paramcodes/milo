---
name: agentic-codebase-design
description: Guides architecting agent-friendly, navigable codebases with vertical feature slices, strict layer boundaries, progressive context disclosure, and self-healing mechanical guardrails. Use when scaffolding a new full-stack project, restructuring an unnavigable codebase, or establishing architectural rules that stop coding agents from introducing monolithic god-files and layer violations.
---

# Agentic Codebase Design

## Overview

Design full-stack software repositories where AI agents and human engineers can navigate, understand, and modify code deterministically without guessing or context overflows. 

Agents follow the path of least resistance. If architectural boundaries are ambiguous or buried under horizontal layers, agents create monolithic god-files, cross-import private internals, invent duplicate helpers in generic `lib/` folders, and bury UI components inside backend directories. This skill establishes the mechanical architecture, file-placement contracts, and guardrails to make the right path the only obvious path.

## When to Use

- Scaffolding a greenfield web application (Next.js, Remix, Node.js).
- Restructuring an existing repository that feels unnavigable or prone to agent regressions.
- Defining directory structures, layer boundaries, and file-placement tables in `AGENTS.md`.
- Setting up self-healing mechanical checks (AST architecture linters, max file-size guards, dead-code detectors).
- Transitioning from messy horizontal "layer cakes" or shallow feature folders to vertical domain slices.

---

## The 5 Inviolable Mechanical Rules

### 1. Absolute Separation of UI and Server
- `.tsx` files, React components, client hooks, and styling tokens must **never** exist inside `server/`, `api/`, or `db/` directories.
- Database queries, ORM instances (Prisma/Drizzle), and server secrets must **never** be imported into client components.
- An agent modifying a visual component (button, card tile, modal) must never be forced to traverse backend queries or API infrastructure to find it.

### 2. Eradicate Generic `lib/` and `utils.ts`
- The generic `lib/` directory inevitably degenerates into an unmaintainable dumping ground of disputed utilities. It is eliminated in favor of explicit, categorized shared layers:
  - `src/shared/kernel/`: Zero-dependency foundation. Branded IDs (`UserId`, `CardId`), domain error classes, and the uniform `Result<T, E>` contract.
  - `src/shared/calc/`: Pure mathematical calculations (e.g. `reorder.calc.ts`). Zero side-effects, 100% unit-testable without database or DOM.
  - `src/shared/ui/`: Dumb presentation primitives (design system tokens, Radix/shadcn buttons, dialogs, inputs, and `cn.util.ts`). Zero domain knowledge.
  - `src/shared/telemetry/`: Structured JSON logging (`logger.ts`). Raw `console.log` is strictly banned.
- The filename `utils.ts` is strictly **banned** across the entire repository. Helpers must have explicit, domain-specific names (e.g., `date-format.util.ts`, `cn.util.ts`).

### 3. Vertical Feature Slices with Repo/Service Separation
- Domain capabilities live in self-contained slices under `src/features/<domain>/`.
- Each slice cleanly isolates responsibilities across standardized files:
  - `<domain>.schema.ts`: Zod validation schemas, inferred types, and DTO contracts.
  - `<domain>.presenter.ts`: Pure view-model transformations (e.g., checklist progress percentage `3/5`, relative due date styling) keeping React components clean.
  - `<domain>.service.ts`: Pure business rules, CQRS coordination, and activity logging. No raw SQL or ORM syntax.
  - `<domain>.repo.ts`: Isolated database queries and ORM operations for that domain.
  - `<domain>.api.ts`: Transport adapters (Next.js Server Actions or route handlers) validating input via schemas and calling services.
  - `components/`: Domain-specific React components and colocated tests (`*.test.tsx`).

### 4. Progressive Context Disclosure & Lean Root Router
- **Root `AGENTS.md` is an Ultra-Lean Router (<80 LOC)**: Contains only essential build/test commands and a Pointer Table.
- **Root `CLAUDE.md` is a 1-Line Pointer (`@AGENTS.md`)**: Symlinked or pointing directly to ensure all agent harnesses (Claude Code, Cursor, Pi, Codex) share a single source of truth.
- **On-Demand Memory (`docs/`)**: Deep reference material is isolated into specialized files so agents read them only when routed:
  - `docs/ARCHITECTURE.md`: Topology and layer import invariants.
  - `docs/DB_SCHEMA.md`: Condensed ERD and entity invariants (avoids grepping migration histories).
  - `docs/ADR/`: Architecture Decision Records explaining *why* decisions were made.
- **Scoped Micro-`AGENTS.md`**: Placed inside feature folders and shared layers containing 5–10 lines of domain-specific constraints.

### 5. Self-Healing Mechanical Guardrails
- Prose instructions in markdown are easily ignored by agents; exit codes are not.
- Every architectural invariant must be wired into executable checks (`scripts/` and pre-commit hooks):
  - `check:arch`: AST import scanner enforcing layer boundaries.
  - `check:size`: Fails if any file exceeds 400 LOC, forcing modular decomposition.
  - `knip`: AST dead-code scanner detecting unused exports and orphaned files.
  - `test`: Colocated integration tests running against a real, ephemeral database (e.g., SQLite `file:test.db`) with zero mocks.

---

## Canonical Directory Topology

```
repo-root/
├── CLAUDE.md                              # [1-LINE POINTER] Contains literally: "@AGENTS.md"
├── AGENTS.md                              # [ROOT ROUTER: <80 LOC] Commands, pointer table & core rules
├── knip.json                              # Dead-code & unused-dependency AST scanner
├── biome.json                             # Biome linter & formatter configuration
├── lefthook.yml                           # Git pre-commit & pre-push hooks
├── package.json                           # Scripts: check:arch, check:size, test, knip, etc.
├── tsconfig.json                          # Strict compiler configuration
├── prisma/                                # (or drizzle/)
│   ├── schema.prisma                      # Canonical database schema
│   ├── seed.ts                            # Reproducible local database seed
│   └── migrations/                        # Database migration history
├── docs/                                  # [ON-DEMAND AGENT MEMORY]
│   ├── ARCHITECTURE.md                    # System topology, layer rules, and error codes
│   ├── DB_SCHEMA.md                       # Condensed ERD & table invariants
│   └── ADR/                               # Architecture Decision Records
│       ├── 001-no-barrel-files.md
│       └── 002-server-actions-over-rest.md
├── scripts/                               # [SELF-HEALING GUARDRAILS]
│   ├── lint-architecture.ts               # AST boundary checker emitting remediation instructions
│   └── check-file-size.ts                 # Fails if any file > 400 lines
└── src/
    ├── app/                               # ROUTING & PAGES (Thin shells only)
    │   ├── layout.tsx                     # Root layout & providers
    │   ├── globals.css                    # Design system CSS variables
    │   └── (dashboard)/                   # Route groups
    │       ├── layout.tsx
    │       └── page.tsx                   # Loads queries, renders feature components
    ├── server/                            # BACKEND INFRASTRUCTURE (Server-only, NO .tsx)
    │   ├── db/
    │   │   └── client.ts                  # Database client singleton
    │   └── auth/
    │       ├── session.ts                 # Cookie session encryption & signature verification
    │       └── session.test.ts            # Colocated session crypto test
    ├── shared/                            # SHARED INFRASTRUCTURE & KERNEL
    │   ├── AGENTS.md                      # Scoped rules: "Zero feature imports allowed inside shared/"
    │   ├── kernel/                        # ZERO-DEPENDENCY CORE TYPES
    │   │   ├── primitives.ts              # Branded IDs (UserId, OrgId)
    │   │   └── result.ts                  # Result<T, E> error contract
    │   ├── calc/                          # PURE MATHEMATICAL FUNCTIONS
    │   │   ├── reorder.calc.ts            # Calculation algorithm
    │   │   └── reorder.calc.test.ts       # Colocated 100% pure math unit test
    │   ├── telemetry/                     # STRUCTURED LOGGING
    │   │   └── logger.ts                  # JSON logger (raw console.log banned)
    │   └── ui/                            # DESIGN SYSTEM PRIMITIVES (Zero domain logic)
    │       ├── tokens.ts                  # Theme tokens & color constants
    │       ├── cn.util.ts                 # Classnames merge utility (banned: utils.ts)
    │       ├── button.tsx                 # Base button primitive
    │       └── button.test.tsx            # Colocated primitive test
    └── features/                          # VERTICAL FEATURE SLICES
        └── <domain>/                      # Self-contained domain capability
            ├── AGENTS.md                  # Scoped domain rules (<15 lines)
            ├── <domain>.schema.ts         # Zod schemas, inferred types, and DTOs
            ├── <domain>.presenter.ts      # Pure view-model formatters
            ├── <domain>.service.ts        # Business logic, CQRS, and activity logging
            ├── <domain>.repo.ts           # Isolated database queries for this domain
            ├── <domain>.service.test.ts   # Colocated integration test (zero-mock DB)
            ├── <domain>.api.ts            # Transport entry point (Server Actions / routes)
            └── components/                # Domain-specific React components
                ├── <feature>-view.tsx
                └── <feature>-view.test.tsx# Colocated component test
```

---

## File-Placement & Import Boundary Contract

Every agent and engineer must strictly obey this placement table:

| Directory Path | Allowed Extensions | Allowed Contents | Allowed Imports | Forbidden Imports / Violations |
|---|---|---|---|---|
| `src/app/` | `.ts`, `.tsx` | Thin page shells, layouts, CSS | `@/features/*`, `@/shared/*` | Direct database imports (`@/server/db`), raw SQL/Prisma calls |
| `src/server/db/` | `.ts` only | Database singleton client (`client.ts`) | `@prisma/client`, database driver | **NO `.tsx` files**. No React, no hooks, no UI imports |
| `src/server/auth/` | `.ts` only | Session encryption, password crypto | `@/server/db`, `@/shared/kernel/*` | **NO `.tsx` files**. No React components, no UI tokens |
| `src/shared/kernel/` | `.ts` only | Core `Result<T>` type, branded semantic IDs | None (pure zero-dependency core) | **NO `.tsx` files**. No server, database, or feature imports |
| `src/shared/calc/` | `.ts` only | Pure calculation functions | `@/shared/kernel/*` | **NO `.tsx` files**. No React, no DOM, no DB, zero side-effects |
| `src/shared/telemetry/` | `.ts` only | Structured JSON logger (`logger.ts`) | None | Raw `console.log` is strictly banned |
| `src/shared/ui/` | `.ts`, `.tsx` | Design tokens, `cn.util.ts`, UI primitives | `@/shared/kernel/*`, Radix UI, `clsx`, `tailwind-merge` | **Banned filename `utils.ts`**. No feature imports, no database imports |
| `src/features/<d>/<d>.schema.ts` | `.ts` only | Zod schemas, inferred types | `zod`, `@/shared/kernel/*` | **NO `.tsx` files**. No React, no database access |
| `src/features/<d>/<d>.presenter.ts` | `.ts` only | Pure view-model formatters (dates, progress %) | `<d>.schema.ts`, `@/shared/kernel/*` | **NO `.tsx` files**. Pure functions only. No database calls |
| `src/features/<d>/<d>.service.ts` | `.ts` only | Domain business logic, CQRS, and activity logging | `<d>.repo.ts`, `<d>.schema.ts`, `@/shared/kernel/*`, `@/shared/calc/*` | **NO `.tsx` files**. No direct ORM calls (delegates to repo) |
| `src/features/<d>/<d>.repo.ts` | `.ts` only | Isolated database queries for `<domain>` | `@/server/db`, `<d>.schema.ts` | **NO `.tsx` files**. No business rules or validation |
| `src/features/<d>/<d>.api.ts` | `.ts` only | Transport adapters (Server Actions / routes) | `<d>.service.ts`, `<d>.schema.ts`, `@/shared/kernel/*` | **NO `.tsx` files**. No React component rendering |
| `src/features/<d>/components/` | `.tsx`, `.ts` | Domain-specific UI presentation | `<d>.schema.ts`, `<d>.presenter.ts`, `<d>.api.ts`, `@/shared/ui/*`, React | Direct DB imports (`@/server/db`), raw Prisma calls |

---

## TypeScript Core Patterns (`api-and-interface-design`)

### 1. Branded Semantic Primitives
Prevent passing an entity ID to a parameter expecting a different entity ID:
```typescript
// src/shared/kernel/primitives.ts
export type UserId = string & { readonly __brand: 'UserId' };
export type BoardId = string & { readonly __brand: 'BoardId' };
export type CardId = string & { readonly __brand: 'CardId' };
```

### 2. Strict Result Contract
Never throw untyped runtime exceptions for expected business failures. Return a typed `Result`:
```typescript
// src/shared/kernel/result.ts
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

---

## Production Reference Architectures (Case Studies)

This skill synthesizes proven patterns from battle-tested production repositories:

### Case Study 1: Trigger.dev (`github.com/triggerdotdev/trigger.dev`)
- **Single Source of Truth**: Uses a 1-line `CLAUDE.md` pointer (`@AGENTS.md`) so all AI coding tools (Claude, Cursor, Codex, Pi) consume the exact same instructions without duplication.
- **Automated Dead-Code Enforcement**: Uses `knip.json` (`pnpm run knip`) in CI and pre-commit hooks to detect orphaned types, unused helper functions, and dead exports left behind by AI agents.
- **Presenters vs. Services**: Isolates UI view-model shaping (`app/presenters/`) from business logic and side effects (`app/services/`), preventing heavy data computation inside React component trees.
- **Barrel Import Ban**: Banned monolithic root barrel files (`packages/core/src/v3/`) in favor of direct subpath imports to eliminate circular dependency loops and improve build performance.
- **Zero-Mock Testing**: Executes integration tests against real databases via testcontainers rather than mocking ORM calls.

### Case Study 2: PlatformPlatform (`github.com/platformplatform/PlatformPlatform`)
- **Self-Contained Systems (SCS)**: Organizes capabilities into vertical slices where each domain module packages its API presentation, Core business logic, and WebApp frontend components together.
- **The Shared Kernel**: Establishes a zero-dependency `shared-kernel` layer strictly reserved for cross-cutting types (such as `Result<T, E>`, domain errors, and branded IDs).
- **The Shared WebApp**: Isolates reusable design system primitives (ShadCN, Base UI, tokens) completely decoupled from business domain models.
- **CQRS Discipline**: Group read-only queries (for fast, un-cached data loading) separately from write commands (mutations with business invariants and transactions) inside domain services.
- **Exception Elimination**: Services return explicit `Result.success(data)` or `Result.failure(error)` objects rather than throwing raw runtime exceptions.

### Case Study 3: The 80-LOC Router & Self-Healing Guardrails Repository
- **Progressive Disclosure**: Employs an ultra-lean root router `AGENTS.md` (<80 lines) containing only canonical commands and a pointer table. Domain-specific rules live in localized micro-`AGENTS.md` files (5–15 lines) inside feature folders, conserving ~20% context window tokens per agent turn.
- **On-Demand Memory**: Isolates deep architecture, database entity relationships, and architectural decision records into `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.
- **Self-Healing AST Checks**: Runs `scripts/lint-architecture.ts` (`bun run check:arch`) which parses AST imports and prints actionable remediation messages (e.g. *"Violation: `shared/` cannot import from `features/`. Move the shared logic to `shared/kernel/`"*).
- **Max File Size Guard**: Runs `scripts/check-file-size.ts` (`bun run check:size`) to fail the build if any file exceeds 400 LOC, mechanically preventing agents from authoring monolithic god-files.
- **Repo vs. Service Split**: Separates domain business logic (`<domain>.service.ts`) from raw database queries (`<domain>.repo.ts`), enforcing the Single Responsibility Principle inside each domain slice.
- **Structured Telemetry**: Uses a centralized JSON logger (`src/shared/telemetry/logger.ts`) and bans raw `console.log` via linter rules.

---

## Foundational References & Theoretical Influences

- **Matt Pocock (`codebase-design`)**: The vocabulary of deep modules (small interface, large implementation), clean seams, high caller leverage, and maintainer locality.
- **Addy Osmani (`api-and-interface-design`)**: Contract-first design, branded types, and boundary validation.
- **Simon Brown (*Package by Component* / C4 Model)**: Grouping related functionality into self-contained components rather than horizontal technical layers.
- **John Ousterhout (*A Philosophy of Software Design*)**: Information hiding, interface minimization, and the elimination of shallow pass-through modules.

---

## Step-by-Step Procedure: Scaffolding a New Project

1. **Bootstrap Root Router & Pointers**:
   - Create root `AGENTS.md` (<80 lines) containing verification commands and the Pointer Table.
   - Create root `CLAUDE.md` with `@AGENTS.md`.
   - Create `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.
2. **Establish the Shared Infrastructure**:
   - Create `src/shared/kernel/` (`primitives.ts`, `result.ts`).
   - Create `src/shared/calc/` for pure mathematical logic.
   - Create `src/shared/ui/` for design tokens, `cn.util.ts`, and base primitives.
   - Create `src/shared/telemetry/logger.ts` and ban raw `console.log`.
3. **Build Vertical Feature Slices**:
   - Identify aggregate roots (e.g. `auth`, `boards`, `cards`).
   - In each feature slice, create:
     - `AGENTS.md` (scoped micro-rules)
     - `<domain>.schema.ts` (Zod contracts)
     - `<domain>.presenter.ts` (pure UI formatters)
     - `<domain>.repo.ts` (isolated database queries)
     - `<domain>.service.ts` (domain rules & transactions returning `Result<T>`)
     - `<domain>.api.ts` (Server Actions validating inputs via schema)
     - `components/` (React UI components and colocated tests)
4. **Wire Self-Healing Mechanical Checks**:
   - Add `scripts/lint-architecture.ts` (`bun run check:arch`).
   - Add `scripts/check-file-size.ts` (`bun run check:size`).
   - Add `knip.json` (`bun run knip`).
   - Configure Lefthook pre-commit hooks to run all checks before commits.

---

## Anti-Patterns & Red Flags to Reject

| Anti-Pattern | Why It Breaks Agents | Approved Remedy |
|---|---|---|
| **Horizontal Layer Cake** (`contracts/`, `server/`, `client/`) | Agents must jump across 5 distant directories to make one change. | Use vertical feature slices (`src/features/<domain>/`). |
| **Burying UI in Server / API** | Agents looking to style a button have to read database queries and crypto code. | Keep UI strictly in `src/features/<domain>/components/` or `src/shared/ui/`. |
| **Generic `lib/` and `utils.ts`** | Becomes an unmaintained junk drawer of conflicting helper functions. | Split into explicit shared layers (`kernel/`, `calc/`, `ui/`, `telemetry/`). Ban `utils.ts`. |
| **Monolithic Root Barrels** (`index.ts` re-exporting all files) | Causes circular dependency loops, slows typechecks, and pollutes autocompletion. | Ban root barrels; use explicit subpath imports. |
| **Giant Monolithic Files (>400 LOC)** | Degrades LLM attention, causes failed edits, and exceeds context budgets. | Enforce 400 LOC max via `scripts/check-file-size.ts`. |
| **Mocking Databases in Tests** | Mocks lie about unique constraints, foreign keys, and transaction cascades. | Test against an ephemeral, real database (e.g. SQLite `file:test.db`). |

---

## Verification Checklist

Before considering an architecture or slice complete:

- [ ] Root `AGENTS.md` is strictly under 80 lines and acts as a router.
- [ ] Root `CLAUDE.md` is a 1-line pointer (`@AGENTS.md`).
- [ ] On-demand memory established in `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, and `docs/ADR/`.
- [ ] No `.tsx` or React components exist in `server/`, `api/`, or `db/`.
- [ ] No generic `lib/` directory or file named `utils.ts` exists.
- [ ] All features are vertically sliced with `<domain>.schema.ts`, `<domain>.presenter.ts`, `<domain>.service.ts`, `<domain>.repo.ts`, `<domain>.api.ts`, and `components/`.
- [ ] Shared layers are organized into `kernel/`, `calc/`, `ui/`, and `telemetry/`.
- [ ] `bun run check:arch` passes with 0 layer violations.
- [ ] `bun run check:size` passes with 0 files > 400 lines.
- [ ] `bun run knip` passes with 0 dead code or unused export warnings.
- [ ] All tests are colocated and pass against a real ephemeral database with zero mocks.
