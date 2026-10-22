## Summary of Changes
Provide a brief summary of the changes introduced in this pull request and the problem they solve.

## Linked Issue
Closes #(issue)

## Architectural & Layer Compliance
- [ ] No `.tsx` or UI components placed in `server/`, `db/`, or `api/`
- [ ] No files named `utils.ts` and no `lib/` directory
- [ ] No barrel files (`index.ts` re-exports); direct subpath imports only
- [ ] Clean separation between `<domain>.service.ts` and `<domain>.repo.ts`
- [ ] Errors returned via `Result<T, E>` rather than untyped throws
- [ ] No file exceeds 400 lines of code

## Canonical Verification Checklist (All Must Pass Before Merge)
- [ ] `bun run check:arch` (0 architectural/layer boundary violations)
- [ ] `bun run check:size` (0 files > 400 LOC)
- [ ] `bun run check` (Biome format & lint check passes)
- [ ] `bun run typecheck` (Strict TypeScript compiles with 0 errors)
- [ ] `bun run knip` (0 dead code, orphaned exports, or unused dependencies)
- [ ] `bun run test` (100% unit and zero-mock SQLite integration tests pass)
