# Shared Layer Rules
- Zero feature imports allowed inside `src/shared/`.
- `shared/kernel/` must have 0 dependencies (pure types and primitives).
- `shared/calc/` must be 100% pure math functions; no DOM, React, or DB.
- `shared/ui/` contains only presentation primitives; zero domain logic.
- Raw `console.log` is banned; use `shared/telemetry/logger.ts`.
- The filename `utils.ts` is strictly forbidden.
