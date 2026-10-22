# Lists Feature Rules
- Lists strictly belong to a Board. Enforce `boardId` validation on all mutations.
- Deleting a list cascades to contained cards and checklists cleanly in `lists.repo.ts`.
- Return `Result<T>` from `lists.service.ts` for all business outcomes.
