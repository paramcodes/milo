# AGENTS.md — Repository Router & Engineering Contract

Milo is an agent-verifiable, tactile Trello clone built with Next.js App Router, TypeScript (Strict), Tailwind CSS (Atlassian Design System tokens), `@hello-pangea/dnd`, and Prisma with SQLite.

## 1. Canonical Verification Commands (Run Before Commit)

```bash
bun run check:arch      # AST architectural linter (enforces layer boundaries)
bun run check:size      # Fails if any file > 400 lines (prevents god-files)
bun run check           # Biome format & lint checker
tsrs                    # Fast Rust-based typechecker (fallback: bun x tsc --noEmit)
bun run knip            # AST scanner for dead code, unused exports & dependencies
bun run test            # Colocated unit & zero-mock SQLite integration tests
```

---

## 2. On-Demand Memory & Routing Table

Do not grep the whole repository. Navigate directly using this routing table:

| If you need to: | Consult this file first: |
|---|---|
| Understand system topology, error codes, and layer rules | `docs/ARCHITECTURE.md` |
| Inspect database entities, relations, and table invariants | `docs/DB_SCHEMA.md` |
| Understand past technical decisions & architectural trade-offs | `docs/ADR/` |
| Work on Shared Kernel, Math, UI, or Telemetry | `src/shared/AGENTS.md` |
| Work on Auth, Sessions, or Password Hashing | `src/features/auth/AGENTS.md` |
| Work on Boards, Canvases, or Workspaces | `src/features/boards/AGENTS.md` |
| Work on Lists or Column Operations | `src/features/lists/AGENTS.md` |
| Work on Cards, Modals, Checklists, or Activity Feeds | `src/features/cards/AGENTS.md` |

---

## 3. Inviolable Core Rules
1. **No UI in Server/DB**: `.tsx` files, hooks, and styling tokens must **never** exist inside `server/`, `db/`, or `api/`.
2. **No `lib/` or `utils.ts`**: Layered into `shared/kernel/`, `shared/calc/`, `shared/ui/`, `shared/telemetry/`. The filename `utils.ts` is strictly **banned**.
3. **No Monolithic Barrels**: Banned root `index.ts` re-exports. Use explicit subpaths (e.g. `@/shared/kernel/result`).
4. **Vertical Slices**: Each domain isolates `<d>.schema.ts`, `<d>.service.ts`, `<d>.repo.ts`, `<d>.api.ts`, and `components/`.
5. **File Size Limit**: No file may exceed 400 lines. Split modularly if approaching 400 LOC.
