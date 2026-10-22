# Cards Feature Rules
- All card position calculations must use `@/shared/calc/reorder.calc.ts`; never invent ad-hoc index math.
- State-changing commands (card created, card moved, checklist toggled) must automatically write an audit entry to `ActivityLog`.
- Keep view-model logic (percentage completed `3/5`, relative due date styling) in `cards.presenter.ts`.
- `cards.service.ts` contains domain logic and transactions; `cards.repo.ts` handles pure Prisma queries.
