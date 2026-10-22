# Milo Boards: Task List

## Phase 1: Foundation & Guardrails

### Task 1: Project Setup, Config & Mechanical Guardrails
**Description:** Initialize package.json, TypeScript configuration, Biome linter/formatter, Knip, and custom AST architectural linter & file size guard scripts.

**Acceptance criteria:**
- [x] `package.json` contains all dependencies (`next`, `react`, `@prisma/client`, `@hello-pangea/dnd`, `zod`, `tailwind-merge`, `clsx`, `vitest`, `prisma`, `biome`, `knip`, etc.) and canonical scripts (`check:arch`, `check:size`, `check`, `knip`, `test`, `seed`).
- [x] `tsconfig.json` enforces strict TypeScript rules (`strict`, `noImplicitAny`, `strictNullChecks`, path alias `@/*`).
- [x] `biome.json` configures formatting and linting rules.
- [x] `scripts/lint-architecture.ts` checks layer import boundaries per SPEC.md and AGENTS.md.
- [x] `scripts/check-file-size.ts` enforces <400 LOC on all source files.

**Verification:**
- [x] Tests pass: `bun run check:size` succeeds
- [x] Build succeeds: `bun run check:arch` runs without error
- [x] Manual check: Run `bun run check` to verify Biome configuration

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `biome.json`
- `scripts/lint-architecture.ts`
- `scripts/check-file-size.ts`

**Estimated scope:** Medium (5 files)

---

### Task 2: Database Schema & Client
**Description:** Define the SQLite Prisma schema according to `docs/DB_SCHEMA.md` and instantiate the singleton Prisma database client.

**Acceptance criteria:**
- [x] `prisma/schema.prisma` defines models: `User`, `Session`, `Team`, `TeamMember`, `Board`, `List`, `Card`, `ChecklistItem`, `Label`, `CardLabel`, and `ActivityLog` with foreign key relations and cascade rules.
- [x] `src/server/db/client.ts` exports the singleton Prisma client `db` with global caching in development.
- [x] Prisma generates client types cleanly without errors.

**Verification:**
- [x] Tests pass: `bunx prisma validate` passes
- [x] Build succeeds: `bunx prisma generate` generates `@prisma/client`
- [x] Manual check: Verify `src/server/db/client.ts` has no UI imports or `.tsx` files

**Dependencies:** Task 1

**Files likely touched:**
- `prisma/schema.prisma`
- `src/server/db/client.ts`

**Estimated scope:** Small (2 files)

---

### Task 3: Shared Kernel, Calculation Math & Telemetry
**Description:** Implement zero-dependency core types (branded IDs, `Result<T, E>`), pure reordering math for drag-and-drop, and structured JSON telemetry.

**Acceptance criteria:**
- [x] `src/shared/kernel/primitives.ts` defines branded types for `UserId`, `BoardId`, `ListId`, `CardId`, and `ChecklistItemId`.
- [x] `src/shared/kernel/result.ts` provides typed `Result.success(data)` and `Result.failure(code, message, details)` helper contracts.
- [x] `src/shared/calc/reorder.calc.ts` provides pure `calculateReorderedPosition` distributing positions in multiples of 1000.
- [x] `src/shared/calc/reorder.calc.test.ts` thoroughly tests intra-list, cross-list, and edge-case reordering.
- [x] `src/shared/telemetry/logger.ts` outputs structured JSON logs for info, warn, and error without raw `console.log`.

**Verification:**
- [x] Tests pass: `bun test src/shared/calc/reorder.calc.test.ts` passes with 100% coverage
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Verify `src/shared/` has zero feature or server imports

**Dependencies:** Task 1

**Files likely touched:**
- `src/shared/kernel/primitives.ts`
- `src/shared/kernel/result.ts`
- `src/shared/calc/reorder.calc.ts`
- `src/shared/calc/reorder.calc.test.ts`
- `src/shared/telemetry/logger.ts`

**Estimated scope:** Medium (5 files)

---

### Task 4: Shared UI Primitives & Atlassian Design Tokens
**Description:** Implement Atlassian design tokens, class merge utility, and foundational UI components (Button, Input, Badge).

**Acceptance criteria:**
- [x] `src/shared/ui/atlassian-tokens.ts` exports color constants and hex tokens matching Atlassian design palette (neutral, primary, success, warning, danger).
- [x] `src/shared/ui/cn.util.ts` exports `cn()` using `clsx` and `tailwind-merge` (file named `cn.util.ts`, not `utils.ts`).
- [x] `src/shared/ui/button.tsx` and `button.test.tsx` provide accessible button variants with unit tests.
- [x] `src/shared/ui/input.tsx` provides styled form input.
- [x] `src/shared/ui/badge.tsx` provides color badge chips for Trello labels.

**Verification:**
- [x] Tests pass: `bun test src/shared/ui/button.test.tsx` passes
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Verify no file named `utils.ts` exists in the repo

**Dependencies:** Task 1, Task 3

**Files likely touched:**
- `src/shared/ui/atlassian-tokens.ts`
- `src/shared/ui/cn.util.ts`
- `src/shared/ui/button.tsx`
- `src/shared/ui/button.test.tsx`
- `src/shared/ui/input.tsx`
- `src/shared/ui/badge.tsx`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: Foundation & Guardrails
- [x] All unit tests pass (`bun run test`)
- [x] `bun run check:arch` passes with zero layer violations
- [x] `bun run check:size` passes with all files < 400 LOC
- [x] `bun run check` reports clean formatting and linting
- [x] Review foundation with human before proceeding

---

## Phase 2: Authentication & Session Management (Vertical Slice)

### Task 5: Server Auth Crypto & Session Engine
**Description:** Build cookie session encryption, signature verification, and password hashing using Web Crypto / scrypt.

**Acceptance criteria:**
- [x] `src/server/auth/session.ts` provides `hashPassword`, `verifyPassword`, `createSessionToken`, and `verifySessionToken`.
- [x] Session tokens use signed payloads stored in HTTP-only, secure, SameSite cookies.
- [x] `src/server/auth/session.test.ts` verifies password hashing and token generation/verification.

**Verification:**
- [x] Tests pass: `bun test src/server/auth/session.test.ts` passes
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Confirm no passwords or secret keys are logged

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `src/server/auth/session.ts`
- `src/server/auth/session.test.ts`

**Estimated scope:** Small (2 files)

---

### Task 6: Auth Domain Backend & Verification
**Description:** Create the vertical slice backend for auth: Zod schemas, isolated repository queries, and service business logic with zero-mock SQLite tests.

**Acceptance criteria:**
- [x] `src/features/auth/auth.schema.ts` defines `loginSchema`, `registerSchema`, and inferred DTO types.
- [x] `src/features/auth/auth.repo.ts` handles Prisma queries for user lookups, user creation, and session tracking.
- [x] `src/features/auth/auth.service.ts` coordinates registration, password validation, and session creation returning `Result<UserSessionDto>`.
- [x] `src/features/auth/auth.service.test.ts` validates registration and login flows against ephemeral SQLite database with real constraints.

**Verification:**
- [x] Tests pass: `bun test src/features/auth/auth.service.test.ts` passes
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Duplicate user registration properly returns a typed error failure

**Dependencies:** Task 2, Task 3, Task 5

**Files likely touched:**
- `src/features/auth/auth.schema.ts`
- `src/features/auth/auth.repo.ts`
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.service.test.ts`

**Estimated scope:** Medium (4 files)

---

### Task 7: Auth Server Actions & Authentication UI
**Description:** Implement Server Actions for login/register/logout and interactive authentication forms and pages.

**Acceptance criteria:**
- [x] `src/features/auth/auth.api.ts` defines Server Actions (`loginAction`, `registerAction`, `logoutAction`) setting/clearing session cookies.
- [x] `src/features/auth/components/login-form.tsx` renders accessible login form with error feedback.
- [x] `src/features/auth/components/register-form.tsx` renders accessible register form.
- [x] `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` render the auth forms.
- [x] `src/app/layout.tsx` and `src/app/globals.css` set up global layout and Tailwind Atlassian token variables.

**Verification:**
- [x] Tests pass: `bun run check:arch` passes (no DB in UI components)
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Form inputs validate cleanly with Zod schemas

**Dependencies:** Task 4, Task 6

**Files likely touched:**
- `src/features/auth/auth.api.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/register-form.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: Authentication
- [x] Full registration, login, and session cookie lifecycle verified in tests
- [x] Clean typecheck and linting on auth slice
- [x] Review with human before proceeding

---

## Phase 3: Boards & Workspace Dashboard (Vertical Slice)

### Task 8: Boards Domain Backend
**Description:** Implement schemas, database repository, and business service with CQRS (queries vs. commands) for board management.

**Acceptance criteria:**
- [x] `src/features/boards/boards.schema.ts` defines `createBoardSchema`, `updateBoardSchema`, and board DTOs.
- [x] `src/features/boards/boards.repo.ts` executes Prisma queries for boards and team workspace memberships.
- [x] `src/features/boards/boards.service.ts` enforces user workspace permissions and separates read queries (`getBoard`, `getUserBoards`) from write commands (`createBoard`, `updateBoard`).
- [x] `src/features/boards/boards.service.test.ts` tests board creation, ownership validation, and querying on ephemeral SQLite.

**Verification:**
- [x] Tests pass: `bun test src/features/boards/boards.service.test.ts` passes
- [x] Build succeeds: `bun x tsc --noEmit`
- [x] Manual check: Unauthorized access attempts return `Result.failure('UNAUTHORIZED', ...)`

**Dependencies:** Task 2, Task 3, Task 6

**Files likely touched:**
- `src/features/boards/boards.schema.ts`
- `src/features/boards/boards.repo.ts`
- `src/features/boards/boards.service.ts`
- `src/features/boards/boards.service.test.ts`

**Estimated scope:** Medium (4 files)

---

### Task 9: Boards Server Actions & Dashboard Shell
**Description:** Implement Server Actions for boards and the user dashboard page displaying personal and team boards.

**Acceptance criteria:**
- [ ] `src/features/boards/boards.api.ts` provides `createBoardAction` and `updateBoardAction`.
- [ ] `src/features/boards/components/boards-dashboard.tsx` renders board cards grid with a create board trigger.
- [ ] `src/features/boards/components/board-header.tsx` displays board title and quick settings.
- [ ] `src/app/(dashboard)/layout.tsx` provides dashboard navigation shell and session validation.
- [ ] `src/app/(dashboard)/page.tsx` fetches user boards and renders `<BoardsDashboard />`.

**Verification:**
- [ ] Tests pass: `bun run check:arch` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Dashboard shell renders cleanly with board cards

**Dependencies:** Task 7, Task 8

**Files likely touched:**
- `src/features/boards/boards.api.ts`
- `src/features/boards/components/boards-dashboard.tsx`
- `src/features/boards/components/board-header.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/page.tsx`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: Boards & Workspace Management
- [ ] User can create boards and view them on the dashboard
- [ ] Server actions enforce user permissions
- [ ] Review with human before proceeding

---

## Phase 4: Lists & Column Management (Vertical Slice)

### Task 10: Lists Domain Backend
**Description:** Implement lists domain logic: validation schemas, repository queries, and service with position management and cascade deletion.

**Acceptance criteria:**
- [ ] `src/features/lists/lists.schema.ts` defines `createListSchema`, `updateListTitleSchema`, and `reorderListsSchema`.
- [ ] `src/features/lists/lists.repo.ts` queries lists by board ID and handles list deletion with cascade.
- [ ] `src/features/lists/lists.service.ts` calculates position intervals (multiples of 1000) using `reorder.calc.ts` and returns `Result<ListDto>`.
- [ ] `src/features/lists/lists.service.test.ts` verifies list creation, title update, and cascade deletion on ephemeral SQLite.

**Verification:**
- [ ] Tests pass: `bun test src/features/lists/lists.service.test.ts` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Deleting a list cleans up child records

**Dependencies:** Task 3, Task 8

**Files likely touched:**
- `src/features/lists/lists.schema.ts`
- `src/features/lists/lists.repo.ts`
- `src/features/lists/lists.service.ts`
- `src/features/lists/lists.service.test.ts`

**Estimated scope:** Medium (4 files)

---

### Task 11: Lists Server Actions & Column Components
**Description:** Build Server Actions for lists and interactive column UI with inline editing and quick add.

**Acceptance criteria:**
- [ ] `src/features/lists/lists.api.ts` provides `createListAction`, `updateListTitleAction`, and `deleteListAction`.
- [ ] `src/features/lists/components/list-column.tsx` renders a Kanban column container with editable title and delete menu.
- [ ] `src/features/lists/components/add-list-input.tsx` provides inline expandable button/input for creating a list.

**Verification:**
- [ ] Tests pass: `bun run check:arch` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Clicking list title switches to inline input for editing

**Dependencies:** Task 4, Task 10

**Files likely touched:**
- `src/features/lists/lists.api.ts`
- `src/features/lists/components/list-column.tsx`
- `src/features/lists/components/add-list-input.tsx`

**Estimated scope:** Medium (3 files)

---

## Checkpoint: Lists Management
- [ ] Lists can be created, edited, and deleted
- [ ] Cascade rules and permissions verified
- [ ] Review with human before proceeding

---

## Phase 5: Cards Core & Quick Add (Vertical Slice)

### Task 12: Cards Domain Backend
**Description:** Implement schemas, repository queries, and service logic for card creation, title editing, and deletion.

**Acceptance criteria:**
- [ ] `src/features/cards/cards.schema.ts` defines `createCardSchema`, `updateCardSchema`, and card DTOs.
- [ ] `src/features/cards/cards.repo.ts` executes Prisma queries for card creation, updates, and list containment.
- [ ] `src/features/cards/cards.service.ts` validates list existence, calculates initial card position, and returns `Result<CardDto>`.
- [ ] `src/features/cards/cards.service.test.ts` tests card creation, position ordering, and deletion on ephemeral SQLite.

**Verification:**
- [ ] Tests pass: `bun test src/features/cards/cards.service.test.ts` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Adding cards increments positions by 1000

**Dependencies:** Task 3, Task 10

**Files likely touched:**
- `src/features/cards/cards.schema.ts`
- `src/features/cards/cards.repo.ts`
- `src/features/cards/cards.service.ts`
- `src/features/cards/cards.service.test.ts`

**Estimated scope:** Medium (4 files)

---

### Task 13: Cards Server Actions & Card Tile Components
**Description:** Implement Server Actions for cards and the draggable card preview tile and quick-add input.

**Acceptance criteria:**
- [ ] `src/features/cards/cards.api.ts` exports `createCardAction`, `updateCardAction`, and `deleteCardAction`.
- [ ] `src/features/cards/components/card-tile.tsx` renders card preview tile with title, label chips, and indicator badges.
- [ ] `src/features/cards/components/add-card-input.tsx` renders inline quick-add card textarea at the bottom of a list.

**Verification:**
- [ ] Tests pass: `bun run check:arch` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Pressing Enter or clicking Add creates a card immediately

**Dependencies:** Task 4, Task 12

**Files likely touched:**
- `src/features/cards/cards.api.ts`
- `src/features/cards/components/card-tile.tsx`
- `src/features/cards/components/add-card-input.tsx`

**Estimated scope:** Medium (3 files)

---

## Checkpoint: Card Creation & Display
- [ ] Cards can be added inline to any list and rendered with Atlassian styling
- [ ] Database updates correctly with typed results
- [ ] Review with human before proceeding

---

## Phase 6: Interactive Drag-and-Drop Board Canvas (Vertical Slice)

### Task 14: DnD Context & Board Canvas Integration
**Description:** Wire `@hello-pangea/dnd` for smooth drag-and-drop of cards (intra-list and cross-list) and horizontal reordering of lists with optimistic UI.

**Acceptance criteria:**
- [ ] `src/features/boards/components/dnd-context.tsx` provides safe SSR-compatible drag-and-drop context.
- [ ] `src/features/boards/components/board-canvas.tsx` renders horizontal list layout with drag handlers for cards and lists, optimistic local reordering, and background server sync.
- [ ] `src/features/boards/components/board-canvas.test.tsx` tests optimistic drag state updates and reorder calculations.
- [ ] `src/app/(dashboard)/b/[boardId]/page.tsx` fetches board details with lists and cards and renders `<BoardCanvas />`.

**Verification:**
- [ ] Tests pass: `bun test src/features/boards/components/board-canvas.test.tsx` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Dragging a card reorders immediately on screen without waiting for server response

**Dependencies:** Task 9, Task 11, Task 13

**Files likely touched:**
- `src/features/boards/components/dnd-context.tsx`
- `src/features/boards/components/board-canvas.tsx`
- `src/features/boards/components/board-canvas.test.tsx`
- `src/app/(dashboard)/b/[boardId]/page.tsx`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Fluid Drag-and-Drop Kanban Interaction
- [ ] Drag-and-drop works smoothly across lists and within lists
- [ ] Server actions persist new positions accurately
- [ ] Review with human before proceeding

---

## Phase 7: Card Details Modal — Labels, Checklists, Due Dates (Vertical Slice)

### Task 15: Card Presenter & Modal Dialog Structure
**Description:** Implement pure view-model transformations in `cards.presenter.ts`, Radix dialog primitive, and main card modal shell.

**Acceptance criteria:**
- [ ] `src/features/cards/cards.presenter.ts` formats checklist progress percentage (e.g. "3/5", 60%) and relative due date status (overdue, due-soon, complete).
- [ ] `src/features/cards/cards.presenter.test.ts` validates presenter calculations with 100% unit test coverage.
- [ ] `src/shared/ui/dialog.tsx` provides an accessible, unstyled Radix dialog primitive.
- [ ] `src/features/cards/components/card-modal.tsx` renders card details dialog with editable title and description.
- [ ] `src/features/cards/components/card-modal.test.tsx` verifies opening dialog and editing description.

**Verification:**
- [ ] Tests pass: `bun test src/features/cards/cards.presenter.test.ts` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Clicking a card tile opens the modal with card title and description

**Dependencies:** Task 4, Task 12

**Files likely touched:**
- `src/features/cards/cards.presenter.ts`
- `src/features/cards/cards.presenter.test.ts`
- `src/shared/ui/dialog.tsx`
- `src/features/cards/components/card-modal.tsx`
- `src/features/cards/components/card-modal.test.tsx`

**Estimated scope:** Medium (5 files)

---

### Task 16: Checklist Items, Label Picker & Due Date Components
**Description:** Build interactive subcomponents for the card modal: checklist with progress bar, color label picker, and due date status badge.

**Acceptance criteria:**
- [ ] `src/shared/ui/popover.tsx` provides Radix popover primitive for dropdowns and pickers.
- [ ] `src/features/cards/components/checklist.tsx` renders checklist items, progress bar, checkbox toggles, and add-item input.
- [ ] `src/features/cards/components/label-picker.tsx` allows selecting/deselecting color-coded Atlassian labels.
- [ ] `src/features/cards/components/due-date-badge.tsx` displays visual due date badge with overdue/due soon styling.

**Verification:**
- [ ] Tests pass: `bun run check:arch` passes
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Toggling checklist item updates progress bar percentage immediately

**Dependencies:** Task 15

**Files likely touched:**
- `src/shared/ui/popover.tsx`
- `src/features/cards/components/checklist.tsx`
- `src/features/cards/components/label-picker.tsx`
- `src/features/cards/components/due-date-badge.tsx`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Rich Card Details & Interactions
- [ ] Checklists, labels, and due dates mutate cleanly and update preview badges on card tiles
- [ ] All components remain < 400 LOC
- [ ] Review with human before proceeding

---

## Phase 8: Audit Trail & Activity Logging (Vertical Slice)

### Task 17: Activity Stream & Audit Logging Integration
**Description:** Record immutable audit entries in `cards.service.ts` transactions and display real-time activity history in the card modal.

**Acceptance criteria:**
- [ ] `src/features/cards/cards.repo.ts` includes `createActivityLogTx` and queries activities ordered by `createdAt: 'desc'`.
- [ ] `src/features/cards/cards.service.ts` records `ActivityLog` on card creation, move, title edit, and checklist toggle inside transactions.
- [ ] `src/features/cards/components/activity-stream.tsx` displays chronological user activity feed with human-readable event descriptions.
- [ ] `card-modal.tsx` embeds `<ActivityStream />` tab or section.

**Verification:**
- [ ] Tests pass: `bun test src/features/cards/cards.service.test.ts` verifies activity logs are created
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: Moving a card or toggling a checklist item renders a new activity entry

**Dependencies:** Task 14, Task 15, Task 16

**Files likely touched:**
- `src/features/cards/cards.repo.ts`
- `src/features/cards/cards.service.ts`
- `src/features/cards/components/activity-stream.tsx`
- `src/features/cards/components/card-modal.tsx`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Activity Feed & Audit Integrity
- [ ] Audit entries written on all card mutations
- [ ] Activity stream displays actor and timestamp accurately
- [ ] Review with human before proceeding

---

## Phase 9: Seeding, Verification & Final Polish

### Task 18: Demo Seed Script
**Description:** Implement `prisma/seed.ts` pre-populating a demo user, demo team, and populated "Sprint Planning" board for instant local testing.

**Acceptance criteria:**
- [ ] `prisma/seed.ts` creates demo user (`demo@milo.app`), demo team, and "Sprint Planning" board.
- [ ] Board includes standard columns ("To Do", "In Progress", "In Review", "Done") populated with realistic cards, labels, checklists, and activity entries.
- [ ] Running `bun run seed` executes without errors and is idempotent.

**Verification:**
- [ ] Tests pass: `bun run seed` exits with 0
- [ ] Build succeeds: `bun x tsc --noEmit`
- [ ] Manual check: SQLite database contains populated board records

**Dependencies:** Task 2, Task 12, Task 17

**Files likely touched:**
- `prisma/seed.ts`

**Estimated scope:** Small (1 file)

---

### Task 19: Full Suite Verification & Mechanical Guardrail Pass
**Description:** Execute all canonical quality verification commands across the entire repository to ensure 100% compliance with SPEC.md and AGENTS.md.

**Acceptance criteria:**
- [ ] `bun run check:arch` passes with 0 layer/import violations.
- [ ] `bun run check:size` passes with 0 files exceeding 400 LOC.
- [ ] `bun run check` (Biome) passes with 0 lint or format warnings.
- [ ] `tsrs` (or `bun x tsc --noEmit`) passes with 0 type errors under strict TypeScript.
- [ ] `bun run knip` detects 0 dead code or orphaned exports.
- [ ] `bun run test` runs all unit, calculation, component, and zero-mock integration tests with 100% pass rate.

**Verification:**
- [ ] Tests pass: `bun run test` passes
- [ ] Build succeeds: `bun run build` succeeds
- [ ] Manual check: All guardrail commands exit with code 0

**Dependencies:** All previous tasks (Tasks 1-18)

**Files likely touched:**
- `package.json`
- `knip.json`

**Estimated scope:** Small (1-2 files)

---

## Final Checkpoint: Ready for Release
- [ ] All 19 tasks completed and verified
- [ ] Core acceptance criteria from `SPEC.md` satisfied
- [ ] Final human review and sign-off
