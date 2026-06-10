# Testing Checklist

## Unit Tests

- [ ] All services tested in isolation
- [ ] All repositories tested
- [ ] All utilities tested
- [ ] All validation schemas tested
- [ ] Edge cases documented and tested
- [ ] Error paths tested
- [ ] Mocks for external dependencies
- [ ] Async behavior tested

## Integration Tests

- [ ] API route handlers tested
- [ ] Server actions tested
- [ ] Database integration tested
- [ ] Cache integration tested
- [ ] Auth flow tested end-to-end
- [ ] File upload/download tested

## Component Tests

- [ ] All interactive components tested
- [ ] Loading states tested
- [ ] Error states tested
- [ ] Empty states tested
- [ ] Accessibility assertions included
- [ ] User interactions tested

## E2E Tests

- [ ] Critical user flows tested
- [ ] Auth flow (login, register, password reset)
- [ ] Workspace CRUD
- [ ] File upload/processing
- [ ] Chat message flow
- [ ] MCP tool execution
- [ ] Connector installation

## Coverage

- [ ] Line coverage >= 80%
- [ ] Branch coverage >= 70%
- [ ] Function coverage >= 90%
- [ ] New code has tests before merge
