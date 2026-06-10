# ADR-003: MongoDB Atlas

## Status

Accepted

## Context

The platform requires a database solution that handles both operational data (users, workspaces, documents) and vector search for the RAG engine. We evaluated SQL and NoSQL options.

## Decision

Use MongoDB Atlas as the primary database, including Atlas Vector Search for embedding storage and similarity search.

## Rationale

- **Vector Search built-in** — MongoDB Atlas includes native vector search (ANN via HNSW/IVF), eliminating the need for a separate vector database
- **Document model** — flexible schema accommodates rapidly evolving domain models during early development
- **Embedded documents** — reduces join complexity for hierarchical data (workspaces > members > permissions)
- **Atlas Search** — built-in text search (Lucene-based) for hybrid search strategies
- **Change streams** — enables real-time data synchronization and event-driven architectures
- **Managed service** — automated backups, monitoring, scaling, and multi-region support
- **Mongoose ecosystem** — mature ODM with TypeScript support, middleware, validation
- **Queryable encryption** — supports field-level encryption for sensitive data

## Trade-offs

- No native joins — requires application-level aggregation or denormalization
- No built-in migrations (compared to Prisma or Drizzle for SQL)
- Eventual consistency by default in replica sets (can be configured for strong consistency)
- Higher cost for equivalent compute compared to PostgreSQL
- Transaction support exists but is more limited than SQL databases

## Rejected Alternatives

- **PostgreSQL + pgvector** — excellent SQL + vector search combo but requires self-hosting or managed service. Neon was considered but Atlas offers tighter integration with vector search and the broader MongoDB ecosystem
- **Supabase** — great all-in-one platform but PostgreSQL-only, no native vector search (requires pgvector extension), and less mature for production workloads at scale
- **Amazon RDS** — SQL-based, requires separate vector database (Pinecone, Weaviate) for RAG
- **Prisma + SQLite** — inadequate for multi-tenant production workloads
- **SQL + Pinecone** — separate operational DB and vector DB increases complexity, operational overhead, and latency

## Consequences

- Mongoose is the ODM layer in `@repo/database`
- Vector indexes are managed via MongoDB Atlas admin UI or programmatic index management
- Repository pattern (`BaseRepository`, `TenantAwareRepository`) provides an abstraction layer to decouple business logic from the database driver
- Future migration to SQL for specific high-consistency domains is possible via the repository abstraction
