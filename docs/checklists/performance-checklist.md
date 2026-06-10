# Performance Checklist

## Frontend

- [ ] Lighthouse score >= 90 (all categories)
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] First Input Delay < 100ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size < 500KB (gzipped) per route
- [ ] Image optimization enabled
- [ ] Font optimization enabled
- [ ] Code splitting configured
- [ ] Tree-shaking verified

## Backend

- [ ] API response time < 200ms (p95)
- [ ] Database query time < 50ms (p95)
- [ ] Cache hit rate > 80%
- [ ] Connection pool utilization < 70%
- [ ] No N+1 queries
- [ ] Query execution plans reviewed
- [ ] Indexes covering all query patterns
- [ ] Pagination on all list endpoints

## Infrastructure

- [ ] CDN configured for static assets
- [ ] Edge caching for API responses
- [ ] Database read replicas configured
- [ ] Queue worker autoscaling enabled
- [ ] Connection pooling tuned
- [ ] Load testing results documented
