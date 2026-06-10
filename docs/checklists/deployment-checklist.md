# Deployment Checklist

## Environment

- [ ] Environment variables configured
- [ ] Secrets stored in platform secrets manager
- [ ] Database connection string verified
- [ ] Redis connection verified
- [ ] R2 bucket access verified
- [ ] OpenRouter API key verified
- [ ] Sentry DSN configured
- [ ] Inngest keys configured
- [ ] Better Auth secret configured

## Infrastructure

- [ ] Build pipeline passing
- [ ] Docker images built (if containerized)
- [ ] Database migrations applied
- [ ] Indexes created
- [ ] DNS records configured
- [ ] TLS certificates valid
- [ ] CDN distribution configured
- [ ] Monitoring dashboards set up
- [ ] Alerts configured

## Verification

- [ ] Health endpoint returns 200
- [ ] Auth flow works end-to-end
- [ ] API responses valid
- [ ] File upload/download works
- [ ] Background jobs processing
- [ ] Cache warming complete
- [ ] Error tracking receiving events
- [ ] Logs shipping to aggregation
