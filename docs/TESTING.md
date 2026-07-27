# Testing

This project uses [Jest](https://jestjs.io/) with TypeScript, Supertest, and an in-memory MongoDB.

## Quick start

```bash
npm test                 # all tests
npm run test:unit        # src/**/*.test.ts
npm run test:integration # tests/integration/**/*.test.ts
npm run test:coverage    # coverage report
```

No Docker or local MongoDB is required for tests. Each run uses `mongodb-memory-server`.

## Layout

```
tests/
  setup/           # env + global mocks
  helpers/         # app, db, auth helpers, factories
  integration/     # HTTP/API tests (Supertest)
src/
  **/*.test.ts     # unit tests co-located with code
```

## Best practices used here

1. **Integration tests for routes** — exercise real Express middleware, validation, auth, and DB together.
2. **Unit tests for pure logic** — errors, paginate, model validation, token schema.
3. **In-memory MongoDB** — fast, isolated, CI-friendly.
4. **Factories** — `tests/helpers/factories/` build consistent test data.
5. **Auth helper** — `registerTestUser()` uses `TEST_EMAIL` bypass for OTP flows.
6. **External services mocked** — email (MailerSend) and Paystack are mocked in `tests/setup/jest.setup.ts`.

## Writing a new integration test

```ts
import request from 'supertest';
import httpStatus from 'http-status';
import { app } from '../helpers/app';
import { setupTestDatabase } from '../helpers/db';
import { registerTestUser, authHeader } from '../helpers/auth.helper';

setupTestDatabase();

describe('My feature', () => {
  test('does something', async () => {
    const { accessToken } = await registerTestUser();

    await request(app)
      .get('/v1/my-route')
      .set(authHeader(accessToken))
      .expect(httpStatus.OK);
  });
});
```

## Environment

Test env vars are set in `tests/setup/env.ts`. Key values:

- `NODE_ENV=test`
- `TEST_EMAIL=test@example.com` — bypasses OTP/password flows in auth
- `BETA_WHITELIST_ENABLED=false` — registration works without waitlist

## What to test where

| Layer | Tool | Example |
|-------|------|---------|
| HTTP routes | Supertest + memory DB | `tests/integration/auth.test.ts` |
| Mongoose models | Direct model calls | `src/modules/user/user.model.test.ts` |
| Middleware/utils | Pure unit tests | `src/utils/errors/error.test.ts` |
| Services | Unit or integration | mock deps for external APIs |

## Tips

- Prefer testing behavior over implementation details.
- One assertion focus per test when possible.
- Use factories instead of hard-coded IDs.
- Mock network calls (email, payments, AWS) — never hit real services in tests.
- Keep integration tests fast; if a suite grows slow, split by domain.
