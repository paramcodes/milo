# ADR 004: Service and Repository Separation in Feature Slices

## Context
Mixing database queries directly into business logic makes domain rules harder to read, harder to unit test, and couples domain invariants to Prisma ORM syntax.

## Decision
In every vertical feature slice (`features/<domain>/`), cleanly separate:
1. `<domain>.service.ts`: Pure business rules, transactions, permission validation, and activity logging.
2. `<domain>.repo.ts`: Isolated Prisma database operations for that domain.

## Consequences
- Single Responsibility Principle inside each domain slice.
- Easy to swap or mock database queries in unit tests when desired, or test against real SQLite in integration tests.
- High readability for both human engineers and AI agents.
