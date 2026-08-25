---
name: db-schema-designer
description: Help design database schemas and data models. Use when you need to plan database structure, create migrations, design data relationships, or optimize queries. USE FOR: database design, schema creation, data modeling, migrations, SQL schema, MongoDB collections.
---

# Database Schema Designer

Guide for designing efficient database schemas and data models.

## When to Use

- Planning new database structure
- Designing data relationships
- Creating migration files
- Optimizing existing schemas
- Choosing between SQL/NoSQL

## How to Use

### Step 1: Understand Requirements
Gather information about:
- What data needs to be stored
- Relationships between entities
- Query patterns (read/write ratio)
- Scale requirements
- Data integrity needs

### Step 2: Choose Database Type
Recommend based on use case:
- **PostgreSQL/MySQL**: Structured data, complex queries, ACID compliance
- **MongoDB**: Flexible schema, document-based, rapid iteration
- **Redis**: Caching, sessions, real-time data
- **SQLite**: Local storage, small apps, embedded

### Step 3: Design Schema
Create schema following best practices:

```sql
-- Example: Users and Goals schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
```

### Step 4: Define Relationships
Choose appropriate relationship types:
- **One-to-One**: User ↔ Profile
- **One-to-Many**: User → Goals
- **Many-to-Many**: Goals ↔ Tags (with junction table)

### Step 5: Add Constraints
Ensure data integrity:
- Primary keys
- Foreign keys with CASCADE/SET NULL
- UNIQUE constraints
- CHECK constraints
- NOT NULL where required

## Design Principles

1. **Normalize** to 3NF minimum, denormalize only for performance
2. **Index** columns used in WHERE, JOIN, ORDER BY
3. **Use UUID** for primary keys in distributed systems
4. **Soft delete** with deleted_at instead of DELETE
5. **Timestamps** on all tables (created_at, updated_at)
6. **Audit trail** for critical data changes

## Migration Pattern

```typescript
// Example: Drizzle migration
import { sql } from 'drizzle-orm';

export const up = sql`
  CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const down = sql`
  DROP TABLE IF EXISTS goals;
`;
```

## Common Patterns

### Soft Delete
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### Versioning
```sql
ALTER TABLE goals ADD COLUMN version INTEGER DEFAULT 1;
-- Increment on each update
```

### Audit Log
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(20),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
