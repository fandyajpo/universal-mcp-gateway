# MongoDB Connection Pooling

> Configured: 2026-06-14
> Defined in: `packages/database/src/connection.ts`

## Configuration

| Parameter | Default | Env Var | Description |
|---|---|---|---|
| `minPoolSize` | 5 | `DATABASE_POOL_MIN` | Minimum connections maintained in the pool |
| `maxPoolSize` | 50 | `DATABASE_POOL_MAX` | Maximum concurrent connections |
| `socketTimeoutMS` | 45000 | — | Close idle sockets after 45s |
| `serverSelectionTimeoutMS` | 5000 | — | Fail fast if no server is available |
| `heartbeatFrequencyMS` | 10000 | — | Check server health every 10s |
| `retryWrites` | true | — | Automatically retry write operations |
| `w` | "majority" | — | Write concern — acknowledge after majority commit |
| `readConcern` | { level: "majority" } | — | Read concern — return majority-committed data |

## Pool Sizing Guidance

### `minPoolSize` (default: 5)

- **Development:** 5 is sufficient.
- **Production (low traffic):** 5-10.
- **Production (high traffic):** 10-25.
- Set high enough to avoid connection storms under load, but low enough to avoid idle resource waste.

### `maxPoolSize` (default: 50)

- **Development:** 10 is sufficient.
- **Production (standard):** 50 is a safe starting point.
- **Production (high throughput):** 100-200, but monitor MongoDB server connection limits.
- MongoDB Atlas M10 supports ~100 connections. M20+ supports 200+.
- Each connection consumes ~1MB of RAM on the server and ~2MB on the client.

### Connection Pool Sizing Formula

```
maxPoolSize = (max concurrent requests) × (average query time in seconds)
              ─────────────────────────────────────────────────────────
              × (1 + buffer)
```

Example: 100 concurrent requests × 50ms avg query time = 5 connections. With 1.5× buffer: ~8 connections.

### When to Increase Pool Size

- `serverSelectionTimeout` errors under load (No server selected)
- High request queuing on the application side
- Connection acquisition time > 5ms under load

### When to Decrease Pool Size

- MongoDB server CPU > 70%
- MongoDB connections count approaching the Atlas tier limit
- High memory usage from connection overhead

## Pool Stats

Use `getPoolStats()` to monitor the connection pool at runtime:

```typescript
import { getPoolStats } from "@repo/database";

const stats = getPoolStats();
// { active: number, idle: number, available: number }
```

Returns `undefined` values if the pool is not yet initialized or if the driver version changes the internal topology structure.

## Health Checks

The `healthCheck()` method runs `db.admin().ping()` and returns:

```typescript
{ ok: boolean; latency: number; error?: string }
```

Health checks should be called every 30-60s in production monitoring.

## Connection Lifecycle

```
connect() → mongoose.connect()
              ↓
         [Connected] ← heartbeat every 10s
              ↓
         [Disconnected] → auto-reconnect (Mongoose default)
              ↓
         disconnect()
```

Mongoose auto-reconnects on connection loss. The `disconnected` and `reconnected` events are logged via `@repo/logger`.

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | — | Yes | MongoDB connection string |
| `DATABASE_POOL_MIN` | 5 | No | Minimum pool size |
| `DATABASE_POOL_MAX` | 50 | No | Maximum pool size |

## Production Tuning Checklist

- [ ] Set `DATABASE_POOL_MAX` based on Atlas tier and expected concurrency
- [ ] Monitor `serverSelectionTimeoutMS` errors in logs
- [ ] Verify connection count in Atlas dashboard matches expected pool size
- [ ] Configure alerts for connection pool exhaustion (>80% of max)
- [ ] Test failover: verify connections re-establish after primary election
- [ ] Review `socketTimeoutMS` — increase if long-running queries are expected
