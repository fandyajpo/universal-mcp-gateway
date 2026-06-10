# Repository: [Entity]Repository

## Extends
`BaseRepository` or `TenantAwareRepository`

## Schema

```typescript
interface [Entity]Document {
  // fields
}
```

## Indexes

## Methods

| Method | Description |
|---|---|
| `findById` | |
| `findByTenant` | |
| `create` | |
| `update` | |
| `delete` | |

## Tests

## Usage

```typescript
const repo = new [Entity]Repository();
const entity = await repo.create(data);
```
