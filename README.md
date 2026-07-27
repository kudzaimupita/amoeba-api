# Amoeba API

Backend API for Amoeba — built with **Express**, **TypeScript**, and **MongoDB**.

Handles authentication, organizations, users, API keys, sessions, and audit logging.

**Repository:** https://github.com/kudzaimupita/amoeba-api

## Features

- TypeScript + Express
- MongoDB with Mongoose
- JWT auth with refresh tokens and OTP email flows
- Google / GitHub OAuth (optional)
- Multi-tenant **companies** and **users**
- API keys, activity logs, beta waitlist
- Request validation (Joi), rate limiting, security middleware
- Jest unit + integration tests (in-memory MongoDB)
- Swagger docs in development (`/v1/docs`)
- Docker Compose for local MongoDB, Redis, Postgres

## Requirements

- Node.js 18 or 20 (LTS recommended)
- npm
- Docker (for local database services)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/kudzaimupita/amoeba-api.git
cd amoeba-api
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Minimum values for local development:

```env
NODE_ENV=development
PORT=3001

MONGODB_URL=mongodb://root:password@localhost:27017/amoeba?authSource=admin
JWT_SECRET=change-me-in-production
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

APP_AWS_ACCESS_KEY=local-dev
APP_AWS_ACCESS_SECRET=local-dev
MAILER_SEND_KEY=local-dev

API_URL=http://localhost:3001
CLIENT_URL=http://localhost:3000

BETA_WHITELIST_ENABLED=false
TEST_EMAIL=test@example.com
```

`TEST_EMAIL` bypasses OTP during registration/login — useful for local dev and tests.

### 3. Start MongoDB

```bash
docker compose up mongo -d
```

### 4. Run the API

```bash
npm run build
npm start
```

Development with hot reload:

```bash
npm run dev
```

Health check: http://localhost:3001/health

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Compile TypeScript in watch mode + nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled app |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests in `src/` |
| `npm run test:integration` | HTTP integration tests |
| `npm run coverage` | Test coverage report |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |

## API routes

Base path: `/v1` (also mounted at `/api/v1`)

| Route | Description |
|-------|-------------|
| `GET /health` | Health check |
| `/v1/auth` | Register, login, OAuth, password reset |
| `/v1/users` | User CRUD and invites |
| `/v1/companies` | Company profile and billing hooks |
| `/v1/tokens` | Token management |
| `/v1/api-keys` | API key CRUD |
| `/v1/account` | Session list / revoke |
| `/v1/activity-logs` | Audit logs |
| `/v1/beta-users` | Waitlist |
| `/v1/docs` | Swagger UI (development only) |
| `/v1/admin` | Admin routes (companies, users, waitlist, tokens) |

### Auth flow (local dev)

Register with the test email to skip OTP:

```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dev User","email":"test@example.com","password":"Password1"}'
```

Use the returned `access.token` as a Bearer token. Authenticated requests also need the `refreshtoken` header set to the refresh token value.

## Project structure

```
src/
  app.ts              Express app + middleware
  index.ts            Server entry point
  connectDB.ts        MongoDB connection
  modules/
    auth/             Authentication & passport
    user/             Users
    company/          Companies & billing
    token/            JWT / refresh tokens
    apiKeys/          API key auth
    account/          Session management
    activityLogs/     Audit trail
    betaUsers/        Waitlist
  clientApp/routes/   Public API route wiring
  adminApp/routes/    Admin API route wiring
  utils/              Errors, logger, pagination, validation
tests/
  integration/        Supertest API tests
  helpers/            Factories, auth helpers, test DB
docs/
  TESTING.md          Testing guide
```

## Testing

Tests use Jest + Supertest with an in-memory MongoDB — no Docker required.

```bash
npm test
```

See [docs/TESTING.md](docs/TESTING.md) for layout, helpers, and how to add new tests.

## Docker services

`docker-compose.yml` includes optional local services:

| Service | Port | Purpose |
|---------|------|---------|
| mongo | 27017 | Primary database |
| redis | 6379 | Cache (optional) |
| postgres | 5432 | Optional relational store |
| localstack | 4566 | Local AWS S3 (optional) |

Only MongoDB is required to run the API today.

## Optional: Go edge services

The repo includes small Go services under `apps/gateway` and `apps/edge`:

```bash
npm run dev:gateway
npm run dev:edge
```

These are optional and separate from the main Node API.

## License

MIT
