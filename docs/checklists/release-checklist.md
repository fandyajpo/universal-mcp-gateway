# Release Checklist

## Pre-Release

- [ ] All tests pass (unit, integration, e2e)
- [ ] TypeScript strict mode passes
- [ ] Lint passes
- [ ] Build succeeds for all apps
- [ ] Bundle size within acceptable thresholds
- [ ] Performance benchmarks met
- [ ] Security scan passes
- [ ] Dependency audit clean
- [ ] CHANGELOG.md updated
- [ ] Version bumped (semver)
- [ ] Migration scripts tested
- [ ] Database backups verified

## Release

- [ ] Tag created
- [ ] Release notes written
- [ ] Artifacts built
- [ ] Deployed to staging
- [ ] Smoke tests pass on staging
- [ ] Deployed to production
- [ ] Health checks pass
- [ ] Monitoring dashboards green

## Post-Release

- [ ] Rollback plan documented
- [ ] Incident response on standby
- [ ] Performance compared to baseline
- [ ] Error rates monitored (24h)
- [ ] User feedback collected
