# ADR 003: Zero-Mock Ephemeral SQLite Integration Testing

## Context
Mocking ORMs and database clients masks foreign key cascade bugs, unique constraint violations, and transaction errors.

## Decision
Run integration tests against an ephemeral, temporary SQLite file database (`file:test.db`) initialized and torn down during test runs. Never mock Prisma.

## Consequences
- Honest tests that verify real database integrity.
- Sub-second test execution without Docker container overhead.
