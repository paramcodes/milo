# ADR 002: Next.js Server Actions over Internal REST API

## Context
For internal application mutations, creating a separate REST API (`/api/cards/:id/move`) requires double serialization, extra route boilerplate, manual fetch clients, and breaks Next.js server cache revalidation.

## Decision
Use Next.js Server Actions (`'use server'`) located in `<domain>.api.ts` for all client-to-server mutations. Validate inputs at the action boundary using Zod schemas from `<domain>.schema.ts`.

## Consequences
- End-to-end type safety directly from server to client.
- Built-in Next.js optimistic UI support (`useOptimistic`).
- Eliminates duplicate HTTP route handler overhead.
