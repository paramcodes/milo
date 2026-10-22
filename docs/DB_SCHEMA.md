# Database Schema & Entity Invariants

## 1. Entity Relationship Overview

```
User (1) ──────────< (N) Session
User (1) ──────────< (N) TeamMember >────────── (1) Team
Team (1) ──────────< (N) Board
Board (1) ─────────< (N) List
List (1) ──────────< (N) Card
Card (1) ──────────< (N) ChecklistItem
Card (1) ──────────< (N) CardLabel >─────────── (1) Label
Card (1) ──────────< (N) ActivityLog
```

## 2. Table Invariants & Rules
- **Board**: Must belong to either a User (personal) or a Team (workspace).
- **List**: Must belong to a `Board`. Position is a non-negative integer spaced by increments of 1000.
- **Card**: Must belong to a `List`. Position is a non-negative integer. Moving a card updates `listId` and `position`.
- **ChecklistItem**: Belongs to a `Card`. Has `title: string` and `isCompleted: boolean`.
- **ActivityLog**: Immutable audit trail. Logs `action`, `actorId`, `cardId`, and JSON `details`.
- **Idempotency**: SQLite transactions run with serializable isolation on state mutations.
