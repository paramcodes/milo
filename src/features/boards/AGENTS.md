# Boards Feature Rules
- Enforce workspace/team authorization before mutating boards.
- Keep read queries (`boards.service.ts` / `boards.repo.ts`) separate from write commands (CQRS).
- `board-canvas.tsx` handles optimistic drag-and-drop state; Server Actions sync in background.
- UI components in `components/` never import `@/server/db` directly.
