# Auth Feature Rules
- Never log passwords, tokens, or session secrets.
- Use Web Crypto / scrypt for hashing and cookie signing.
- `auth.routes.ts` / `auth.api.ts` parses inputs via `auth.schema.ts` and delegates to `auth.service.ts`.
- `auth.service.ts` contains business rules and returns `Result<T>`. Database access is delegated to `auth.repo.ts`.
- Components in `components/` never import `@/server/db` directly.
