# Contributing to Milo

Thank you for your interest in contributing to Milo! We are building a tactile, agent-verifiable Kanban application adhering to clean architectural discipline and Atlassian Design tokens.

Please review this guide before submitting code or opening pull requests.

---

## 1. Code of Conduct

All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with kindness, empathy, and respect.

---

## 2. Prerequisites & Setup

Milo requires **Bun** (v1.1+) and **Node.js** (v18+).

```bash
# 1. Clone the repository
git clone https://github.com/your-username/milo.git
cd milo

# 2. Install dependencies
bun install

# 3. Synchronize SQLite schema and seed demo board
DATABASE_URL="file:./dev.db" bunx prisma db push
DATABASE_URL="file:./dev.db" bun run seed

# 4. Start local development server
DATABASE_URL="file:./dev.db" bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in using:
- **Email**: `demo@milo.app`
- **Password**: `password123`

---

## 3. Inviolable Architectural Invariants

Every change is verified by automated mechanical guardrails in CI. Keep these invariants in mind:

1. **No UI in Server/DB Folders**: `.tsx` files, hooks, and presentation tokens must **never** exist inside `src/server/` or `src/server/db/`.
2. **No `lib/` or `utils.ts`**: The filename `utils.ts` is strictly **banned**. Utilities are partitioned into `src/shared/kernel/` (pure types), `src/shared/calc/` (pure math), `src/shared/ui/` (`cn.util.ts`), or `src/shared/telemetry/` (`logger.ts`).
3. **No Root Barrel Files**: Root `index.ts` re-export files are banned. Use direct subpath imports (e.g. `@/shared/kernel/result`).
4. **Repo & Service Split**: In each feature (`src/features/<domain>/`), business rules and transactions live in `<domain>.service.ts`, while Prisma queries reside in `<domain>.repo.ts`.
5. **Typed `Result<T, E>` Return Discipline**: Domain services return `Result.success(data)` or `Result.failure(code, message)` rather than throwing untyped runtime exceptions.
6. **File Size Limit (< 400 LOC)**: No file may exceed 400 lines of code. Split components and modules modularly.

---

## 4. Git Workflow & Conventional Commits

Direct commits to `master` are forbidden by branch protection hooks. Work on a feature branch:

```bash
git checkout -b feat/your-feature-name
```

### Commit Message Convention
We enforce [Conventional Commits](https://www.conventionalcommits.org/) with a **subject line length ≤ 72 characters**:

```text
feat(cards): add checklist progress indicator to preview tile
fix(auth): handle expired session token redirect cleanly
docs: update architecture decision record for server actions
test(boards): add zero-mock SQLite cascade deletion test
```

---

## 5. Canonical Quality Verification

Before committing or pushing a pull request, run the canonical verification battery:

```bash
bun run check:arch      # AST architectural linter (enforces layer boundaries)
bun run check:size      # Fails if any file > 400 lines (prevents god-files)
bun run check           # Biome format & lint checker (auto-fix: bun run check:fix)
bun run typecheck       # Strict TypeScript typecheck (tsc --noEmit)
bun run knip            # AST scanner for dead code, unused exports & dependencies
bun run test            # Colocated unit & zero-mock SQLite integration tests
bun run build           # Production Next.js build
```

---

## 6. Driving the App with `agent-browser`

We test browser flows and capture visual regression artifacts with [`agent-browser`](https://www.skills.sh/vercel-labs/agent-browser/agent-browser):

```bash
# Start production or dev server
DATABASE_URL="file:./dev.db" bun run start -p 3000

# Open and inspect the running app
agent-browser open http://localhost:3000/login
agent-browser fill @e2 "demo@milo.app"
agent-browser fill @e3 "password123"
agent-browser click @e4
agent-browser screenshot docs/assets/dashboard.png
agent-browser close
```

---

## 7. Submitting a Pull Request

1. Push your branch to GitHub.
2. Open a Pull Request filling out the PR template.
3. Confirm all automated CI status checks pass.
4. Maintainers will review your PR and provide feedback.
