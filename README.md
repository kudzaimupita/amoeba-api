# Amoeba API

Node.js + Express + MongoDB + TypeScript REST API boilerplate with JWT auth, multi-tenant companies, tests, and Docker support.

## Quick Start

To create a project, simply run:

```bash
npx create-nodejs-ts-app <project-name>
```

Or

```bash
npm init nodejs-ts-app <project-name>
```

## Manual Installation

Clone the repo:

```bash
git clone --depth 1 https://github.com/saisilinus/node-express-mongoose-typescript-boilerplate.git
cd node-express-mongoose-typescript-boilerplate
```

Install the dependencies:

```bash
yarn install
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```

## Table of Contents

- [Features](#features)
- [Commands](#commands)
- [Making Changes](#making-changes)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Logging](#logging)
- [Custom Mongoose Plugins](#custom-mongoose-plugins)
  - [To JSON Plugin](#tojson)
  - [Paginate Plugin](#paginate)
- [Linting](#linting)
- [Contributing](#contributing)
- [Inspirations](#inspirations)
- [License](#license)

## Features

- **ES9**: latest ECMAScript features
- **Static Typing**: [TypeScript](https://www.typescriptlang.org/) static typing using typescript
- **Hot Reloading**: [Concurrently](https://github.com/open-cli-tools/concurrently) Hot realoding with concurrently
- **NoSQL database**: [MongoDB](https://www.mongodb.com) object data modeling using [Mongoose](https://mongoosejs.com)
- **Authentication and authorization**: using [passport](http://www.passportjs.org)
- **Validation**: request data validation using [Joi](https://github.com/hapijs/joi)
- **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
- **Testing**: unit and integration tests using [Jest](https://jestjs.io)
- **Error handling**: centralized error handling mechanism
- **API documentation**: with [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Dependency management**: with [Yarn](https://yarnpkg.com)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv) and [cross-env](https://github.com/kentcdodds/cross-env#readme)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **Santizing**: sanitize request data against xss and query injection
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)
- **CI**: continuous integration with [GitHub CI](https://travis-ci.org)
- **Docker support**
- **Code coverage**: using [codecov](https://about.codecov.io/)
- **Code quality**: with [Codacy](https://www.codacy.com)
- **Git hooks**: with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)
- **Editor config**: consistent editor configuration using [EditorConfig](https://editorconfig.org)
- **Changelog Generation**: with [Standard Version](https://github.com/conventional-changelog/standard-version)
- **Structured Commit Messages**: with [Commitizen](https://github.com/commitizen/cz-cli)
- **Commit Linting**: with [CommitLint](https://github.com/conventional-changelog/commitlint)

## Commands

Running locally:

```bash
yarn dev
```

Running in production:

```bash
yarn start
```

Compiling to JS from TS

```bash
yarn compile
```

Compiling to JS from TS in watch mode

```bash
yarn compile:watch
```

Commiting changes

```bash
yarn commit
```

Testing:

```bash
# run all tests
yarn test

# run TypeScript tests
yarn test:ts

# run JS tests
yarn test:js

# run all tests in watch mode
yarn test:watch

# run test coverage
yarn coverage
```

Docker:

```bash
# run docker container in development mode
yarn docker:dev

# run docker container in production mode
yarn docker:prod

# run all tests in a docker container
yarn docker:test
```

Linting:

```bash
# run ESLint
yarn lint

# fix ESLint errors
yarn lint:fix

# run prettier
yarn prettier

# fix prettier errors
yarn prettier:fix
```

## Making Changes

Run `yarn dev` so you can compile Typescript(.ts) files in watch mode

```bash
yarn dev
```

Add your changes to TypeScript(.ts) files which are in the src folder. The files will be automatically compiled to JS if you are in watch mode.

Add tests for the new feature

Run `yarn test:ts` to make sure all Typescript tests pass.

```bash
yarn test:ts
```

## Environment Variables

### AWS Parameter Store Integration (Production)

In production, environment variables are managed securely using **AWS Systems Manager Parameter Store**. This means:
- You do **not** need to keep secrets in your repo or run local scripts to update environment variables.
- The ECS service automatically pulls environment variables from Parameter Store at runtime.
- You can update environment variables directly in the AWS Console, and your containers will restart with the new values.

#### How to update environment variables in production:
1. Go to **AWS Console → Systems Manager → Parameter Store**
2. Find parameters under the `/api-app/` prefix (e.g., `/api-app/MONGODB_URL`)
3. Edit the values directly in the console
4. ECS containers will automatically restart with the new values

**Note:**
- The initial setup for Parameter Store and IAM roles is handled by the deployment scripts. After that, you do not need to run any local scripts for environment variables.
- For local development, you can still use a `.env` file as before.

### Example Parameter Store Keys
```
/api-app/PORT
/api-app/MONGODB_URL
/api-app/JWT_SECRET
/api-app/ENCRYPTION_KEY
/api-app/MAILER_SEND_KEY
/api-app/CLAUDE_API
/api-app/CONTROLLER_API_BASE
/api-app/CLIENT_URL
/api-app/API_URL
/api-app/PAYSTACK_SECRET_KEY
/api-app/NODE_ENV
/api-app/JWT_ACCESS_EXPIRATION_MINUTES
/api-app/JWT_REFRESH_EXPIRATION_DAYS
/api-app/JWT_RESET_PASSWORD_EXPIRATION_MINUTES
/api-app/JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
```

### Local Development
For local development, you can still use a `.env` file. The app will load environment variables from `.env` when running locally.

## Project Structure

```
.
├── src                             # Source files
│   ├── app.ts                        # Express App
│   ├── config                        # Environment variables and other configurations
│   ├── custom.d.ts                   # File for extending types from node modules
│   ├── declaration.d.ts              # File for declaring modules without types
│   ├── index.ts                      # App entry file
│   ├── modules                       # Modules such as models, controllers, services 
│   └── routes                        # Routes
├── TODO.md                         # TODO List
├── package.json
└── README.md
```

## API Documentation

To view the list of available APIs and their specifications, run the server and go to `http://localhost:3000/v1/docs` in your browser. This documentation page is automatically generated using the [swagger](https://swagger.io/) definitions written as comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /v1/auth/register` - register\
`POST /v1/auth/login` - login\
`POST /v1/auth/refresh-tokens` - refresh auth tokens\
`POST /v1/auth/forgot-password` - send reset password email\
`POST /v1/auth/reset-password` - reset password

**User routes**:\
`POST /v1/users` - create a user\
`GET /v1/users` - get all users\
`GET /v1/users/:userId` - get user\
`PATCH /v1/users/:userId` - update user\
`DELETE /v1/users/:userId` - delete user

## Error Handling

The app has a centralized error handling mechanism.

Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.

```javascript
const catchAsync = require('../utils/catchAsync');

const controller = catchAsync(async (req, res) => {
  // this error will be forwarded to the error handling middleware
  throw new Error('Something wrong happened');
});
```

The error handling middleware sends an error response, which has the following format:

```json
{
  "code": 404,
  "message": "Not found"
}
```

When running in development mode, the error response also contains the error stack.

The app has a utility ApiError class to which you can attach a response code and a message, and then throw it from anywhere (catchAsync will catch it).

For example, if you are trying to get a user from the DB who is not found, and you want to send a 404 error, the code should look something like:

```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const getUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
};
```

## Validation

Request data is validated using [Joi](https://joi.dev/). Check the [documentation](https://joi.dev/api/) for more details on how to write Joi validation schemas.

The validation schemas are defined in the `src/validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

```javascript
const express = require('express');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', validate(userValidation.createUser), userController.createUser);
```

## Authentication

To require authentication for certain routes, you can use the `auth` middleware.

```javascript
const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', auth(), userController.createUser);
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

**Generating Access Tokens**:

An access token can be generated by making a successful call to the register (`POST /v1/auth/register`) or login (`POST /v1/auth/login`) endpoints. The response of these endpoints also contains refresh tokens (explained below).

An access token is valid for 30 minutes. You can modify this expiration time by changing the `JWT_ACCESS_EXPIRATION_MINUTES` environment variable in the .env file.

**Refreshing Access Tokens**:

After the access token expires, a new access token can be generated, by making a call to the refresh token endpoint (`POST /v1/auth/refresh-tokens`) and sending along a valid refresh token in the request body. This call returns a new access token and a new refresh token.

A refresh token is valid for 30 days. You can modify this expiration time by changing the `JWT_REFRESH_EXPIRATION_DAYS` environment variable in the .env file.

## Authorization

The `auth` middleware can also be used to require certain rights/permissions to access a route.

```javascript
const express = require('express');
const auth = require('../../middlewares/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/users', auth('manageUsers'), userController.createUser);
```

In the example above, an authenticated user can access this route only if that user has the `manageUsers` permission.

The permissions are role-based. You can view the permissions/rights of each role in the `src/config/roles.js` file.

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.

## Logging

Import the logger from `src/config/logger.js`. It is using the [Winston](https://github.com/winstonjs/winston) logging library.

Logging should be done according to the following severity levels (ascending order from most important to least important):

```javascript
const logger = require('<path to src>/config/logger');

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

In development mode, log messages of all severity levels will be printed to the console.

In production mode, only `info`, `warn`, and `error` logs will be printed to the console.\
It is up to the server (or process manager) to actually read them from the console and store them in log files.\
This app uses pm2 in production mode, which is already configured to store the logs in log files.

Note: API request information (request url, response code, timestamp, etc.) are also automatically logged (using [morgan](https://github.com/expressjs/morgan)).

## Custom Mongoose Plugins

The app also contains 2 custom mongoose plugins that you can attach to any mongoose model schema. You can find the plugins in `src/models/plugins`.

```javascript
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const userSchema = mongoose.Schema(
  {
    /* schema definition here */
  },
  { timestamps: true }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

const User = mongoose.model('User', userSchema);
```

### toJSON

The toJSON plugin applies the following changes in the toJSON transform call:

- removes \_\_v, createdAt, updatedAt, and any schema path that has private: true
- replaces \_id with id

### paginate

The paginate plugin adds the `paginate` static method to the mongoose schema.

Adding this plugin to the `User` model schema will allow you to do the following:

```javascript
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};
```

The `filter` param is a regular mongo filter.

The `options` param can have the following (optional) fields:

```javascript
const options = {
  sortBy: 'name:desc', // sort order
  limit: 5, // maximum results per page
  page: 2, // page number
  projectBy: 'name:hide, role:hide', // fields to hide or include in the results
};
```

The `projectBy` option can include multiple criteria (separated by a comma) but cannot include and exclude fields at the same time. Check out the following examples:

  - [x] `name:hide, role:hide` should work
  - [x] `name:include, role:include` should work
  - [ ] `name:include, role:hide` will not work

The plugin also supports sorting by multiple criteria (separated by a comma): `sortBy: name:desc,role:asc`

The `paginate` method returns a Promise, which fulfills with an object having the following properties:

```json
{
  "results": [],
  "page": 2,
  "limit": 5,
  "totalPages": 10,
  "totalResults": 48
}
```

## Plugin Data API Endpoints & Examples

### Base URL
```
https://your-api-domain.com/api/v1/plugins
```

---

## 📋 1. Get Plugin Data

**Endpoint:** `GET /data/{pluginId}`

### Request Examples

```bash
# Get development users (default)
curl -X GET \
  "https://api.example.com/api/v1/plugins/data/67127abc123?tableName=users&env=dev&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get production users
curl -X GET \
  "https://api.example.com/api/v1/plugins/data/67127abc123?tableName=users&env=prod&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get with filters and sorting
curl -X GET \
  "https://api.example.com/api/v1/plugins/data/67127abc123?tableName=users&env=dev&roles=admin&sortBy=createdAt:desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Example
```json
{
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012", 
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "2024-01-14T09:20:00.000Z",
      "updatedAt": "2024-01-14T09:20:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

---

## ➕ 2. Create Plugin Data

**Endpoint:** `POST /records/{pluginId}/{tableName}`

### Request Examples

```bash
# Create user in development environment
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development User",
    "email": "dev.user@example.com",
    "role": "developer",
    "department": "Engineering",
    "isActive": true,
    "permissions": ["read", "write"]
  }'

# Create user in production environment
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production User",
    "email": "prod.user@company.com", 
    "role": "admin",
    "department": "Operations",
    "isActive": true,
    "permissions": ["read", "write", "delete", "admin"]
  }'

# Create order record
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/67127abc123/orders?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "prod_123",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "total": 59.98,
    "status": "pending",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02101"
    }
  }'
```

### Response Example
```json
{
  "acknowledged": true,
  "insertedId": "507f1f77bcf86cd799439013"
}
```

---

## ✏️ 3. Update Plugin Data

**Endpoint:** `PATCH /records/{pluginId}/{tableName}/{recordId}`

### Request Examples

```bash
# Update user in development
curl -X PATCH \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users/507f1f77bcf86cd799439011?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "senior-developer",
    "permissions": ["read", "write", "deploy"],
    "lastLogin": "2024-01-15T15:30:00.000Z"
  }'

# Update user in production
curl -X PATCH \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users/507f1f77bcf86cd799439011?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "deactivationReason": "User left company",
    "deactivatedAt": "2024-01-15T16:00:00.000Z"
  }'

# Update order status
curl -X PATCH \
  "https://api.example.com/api/v1/plugins/records/67127abc123/orders/507f1f77bcf86cd799439013?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "trackingNumber": "1Z999AA1234567890",
    "shippedAt": "2024-01-15T14:00:00.000Z"
  }'
```

### Response Example
```json
{
  "acknowledged": true,
  "modifiedCount": 1,
  "upsertedId": null,
  "upsertedCount": 0,
  "matchedCount": 1
}
```

---

## 🗑️ 4. Delete Plugin Data

**Endpoint:** `DELETE /records/{pluginId}/{tableName}/{recordId}`

### Request Examples

```bash
# Delete user from development
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users/507f1f77bcf86cd799439011?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete user from production
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/67127abc123/users/507f1f77bcf86cd799439011?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete order
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/67127abc123/orders/507f1f77bcf86cd799439013?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Example
```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```

---

## 🔑 5. Generate Authentication Token

**Endpoint:** `POST /records/generate-token/{pluginId}/{tableName}/{recordId}`

### Request Examples

```bash
# Generate token for development user (1 hour)
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/generate-token/67127abc123/users/507f1f77bcf86cd799439011?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 60,
    "timeUnits": "minutes"
  }'

# Generate token for production user (24 hours)
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/generate-token/67127abc123/users/507f1f77bcf86cd799439011?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 24,
    "timeUnits": "hours"
  }'

# Generate long-term token (30 days)
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/generate-token/67127abc123/users/507f1f77bcf86cd799439011?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 30,
    "timeUnits": "days"
  }'
```

### Response Example
```json
{
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-01-15T17:30:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-02-14T16:30:00.000Z"
    }
  }
}
```

---

## 🚫 6. Blacklist Token

**Endpoint:** `POST /records/blacklist-token/{pluginId}/{tableName}/{recordId}`

### Request Examples

```bash
# Blacklist development user token
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/blacklist-token/67127abc123/users/507f1f77bcf86cd799439011?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "507f1f77bcf86cd799439020"
  }'

# Blacklist production user token
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/blacklist-token/67127abc123/users/507f1f77bcf86cd799439011?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "507f1f77bcf86cd799439021"
  }'
```

### Response Example
```json
{
  "message": "Token successfully blacklisted",
  "tokenId": "507f1f77bcf86cd799439020"
}
```

---

## 📁 7. Upload Files

**Endpoint:** `POST /records/plugin-data-files/{pluginId}`

### Request Examples

```bash
# Upload file to development environment
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/document.pdf" \
  -F "name=Development Document" \
  -F "folderName=dev-uploads"

# Upload file to production environment
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/production-report.xlsx" \
  -F "name=Monthly Report" \
  -F "folderName=reports"

# Upload image with metadata
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/profile.jpg" \
  -F "name=User Profile Image" \
  -F "folderName=avatars"
```

### Response Example
```json
{
  "acknowledged": true,
  "insertedId": "507f1f77bcf86cd799439025",
  "_id": "507f1f77bcf86cd799439025",
  "originalName": "document.pdf",
  "size": 1024576,
  "mimeType": "application/pdf",
  "url": "https://your-bucket.s3.amazonaws.com/67127abc123/dev-uploads/507f1f77bcf86cd799439025",
  "name": "Development Document",
  "folderName": "dev-uploads",
  "createdAt": "2024-01-15T16:30:00.000Z",
  "updatedAt": "2024-01-15T16:30:00.000Z"
}
```

---

## 📧 8. Send Email with Template

**Endpoint:** `POST /records/plugin-data-comms/{pluginId}/{recordId}`

### Request Examples

```bash
# Send email using development template
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-comms/67127abc123/507f1f77bcf86cd799439030?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "developer@example.com",
    "from": "noreply@dev.example.com",
    "subject": "Development Environment Notification",
    "body": {
      "userName": "John Developer",
      "environment": "Development", 
      "action": "User account created",
      "loginUrl": "https://dev.example.com/login",
      "supportEmail": "dev-support@example.com"
    },
    "attachments": []
  }'

# Send email using production template
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-comms/67127abc123/507f1f77bcf86cd799439030?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@company.com",
    "from": "noreply@company.com",
    "subject": "Welcome to Our Platform",
    "body": {
      "userName": "Jane Customer",
      "environment": "Production",
      "action": "Account activated",
      "loginUrl": "https://app.company.com/login",
      "supportEmail": "support@company.com"
    },
    "attachments": [
      {
        "filename": "welcome-guide.pdf",
        "url": "https://assets.company.com/guides/welcome.pdf"
      }
    ]
  }'

# Send order confirmation email
curl -X POST \
  "https://api.example.com/api/v1/plugins/records/plugin-data-comms/67127abc123/507f1f77bcf86cd799439031?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@email.com",
    "subject": "Order Confirmation #12345",
    "body": {
      "customerName": "John Smith",
      "orderNumber": "12345",
      "total": "$59.98",
      "items": [
        {"name": "Product A", "quantity": 2, "price": "$29.99"}
      ],
      "shippingAddress": "123 Main St, Boston, MA 02101"
    }
  }'
```

### Response Example
```json
{
  "pluginId": "67127abc123",
  "recordId": "507f1f77bcf86cd799439030",
  "companyId": "507f1f77bcf86cd799439001",
  "to": "customer@company.com",
  "from": "noreply@company.com",
  "subject": "Welcome to Our Platform",
  "sentAt": "2024-01-15T16:45:00.000Z",
  "status": "sent",
  "by": "Admin User",
  "_id": "507f1f77bcf86cd799439035"
}
```

---

## 🗑️ 9. Delete File

**Endpoint:** `DELETE /records/plugin-data-files/{pluginId}/{folderName}/{fileName}`

### Request Examples

```bash
# Delete file from development environment
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123/dev-uploads/507f1f77bcf86cd799439025?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete file from production environment
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123/reports/507f1f77bcf86cd799439026?env=prod" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete file without folder
curl -X DELETE \
  "https://api.example.com/api/v1/plugins/records/plugin-data-files/67127abc123/root/507f1f77bcf86cd799439027?env=dev" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Example
```json
{
  "message": "File deleted successfully"
}
```

---

## 🔧 JavaScript/Frontend Integration Examples

### React/Vue.js Integration

```javascript
// API service class
class PluginDataService {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  // Get plugin data
  async getPluginData(pluginId, tableName, env = 'dev', options = {}) {
    const params = new URLSearchParams({
      tableName,
      env,
      ...options
    });
    
    const response = await fetch(`${this.baseURL}/plugins/data/${pluginId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }

  // Create plugin data
  async createPluginData(pluginId, tableName, data, env = 'dev') {
    const response = await fetch(`${this.baseURL}/plugins/records/${pluginId}/${tableName}?env=${env}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }

  // Update plugin data
  async updatePluginData(pluginId, tableName, recordId, data, env = 'dev') {
    const response = await fetch(`${this.baseURL}/plugins/records/${pluginId}/${tableName}/${recordId}?env=${env}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }

  // Delete plugin data
  async deletePluginData(pluginId, tableName, recordId, env = 'dev') {
    const response = await fetch(`${this.baseURL}/plugins/records/${pluginId}/${tableName}/${recordId}?env=${env}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }

  // Generate token
  async generateToken(pluginId, tableName, recordId, duration, timeUnits = 'minutes', env = 'dev') {
    const response = await fetch(`${this.baseURL}/plugins/records/generate-token/${pluginId}/${tableName}/${recordId}?env=${env}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration, timeUnits })
    });
    
    return response.json();
  }

  // Upload file
  async uploadFile(pluginId, file, name, folderName, env = 'dev') {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('name', name);
    if (folderName) formData.append('folderName', folderName);

    const response = await fetch(`${this.baseURL}/plugins/records/plugin-data-files/${pluginId}?env=${env}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    
    return response.json();
  }

  // Send email
  async sendEmail(pluginId, recordId, emailData, env = 'dev') {
    const response = await fetch(`${this.baseURL}/plugins/records/plugin-data-comms/${pluginId}/${recordId}?env=${env}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    return response.json();
  }
}

// Usage example
const pluginService = new PluginDataService('https://api.example.com/api/v1', 'your-auth-token');

// Example: User management in different environments
async function manageUsers() {
  const pluginId = '67127abc123';
  
  // Create test user in development
  const devUser = await pluginService.createPluginData(pluginId, 'users', {
    name: 'Test User',
    email: 'test@dev.com',
    role: 'developer'
  }, 'dev');
  
  // Create real user in production
  const prodUser = await pluginService.createPluginData(pluginId, 'users', {
    name: 'John Smith',
    email: 'john@company.com',
    role: 'admin'
  }, 'prod');
  
  // Get development users
  const devUsers = await pluginService.getPluginData(pluginId, 'users', 'dev', {
    page: 1,
    limit: 10,
    sortBy: 'createdAt:desc'
  });
  
  // Get production users
  const prodUsers = await pluginService.getPluginData(pluginId, 'users', 'prod', {
    page: 1,
    limit: 10,
    roles: 'admin'
  });
  
  
  
}
```

### Node.js/Express Integration

```javascript
// Backend service integration
const axios = require('axios');

class PluginDataAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async syncUserToEnvironments(pluginId, userData) {
    try {
      // Create user in development first for testing
      const devUser = await this.client.post(
        `/plugins/records/${pluginId}/users?env=dev`,
        { ...userData, environment: 'development' }
      );
      
      
      
      // After validation, create in production
      const prodUser = await this.client.post(
        `/plugins/records/${pluginId}/users?env=prod`,
        { ...userData, environment: 'production' }
      );
      
      
      
      return { devUser: devUser.data, prodUser: prodUser.data };
    } catch (error) {
      console.error('Error syncing user:', error.response?.data);
      throw error;
    }
  }

  async promoteDataFromDevToProd(pluginId, tableName) {
    try {
      // Get all development data
      const devData = await this.client.get(
        `/plugins/data/${pluginId}?tableName=${tableName}&env=dev&limit=1000`
      );
      
      // Create each record in production
      const promotedRecords = [];
      for (const record of devData.data.results) {
        // Remove dev-specific fields
        const { _id, createdAt, updatedAt, ...cleanRecord } = record;
        
        const prodRecord = await this.client.post(
          `/plugins/records/${pluginId}/${tableName}?env=prod`,
          { ...cleanRecord, promotedFrom: 'dev', promotedAt: new Date() }
        );
        
        promotedRecords.push(prodRecord.data);
      }
      
      return promotedRecords;
    } catch (error) {
      console.error('Error promoting data:', error.response?.data);
      throw error;
    }
  }
}

// Usage
const pluginAPI = new PluginDataAPI('https://api.example.com/api/v1', process.env.API_TOKEN);

// Express route examples
app.post('/users', async (req, res) => {
  try {
    const { environment = 'dev' } = req.query;
    const result = await pluginAPI.client.post(
      `/plugins/records/67127abc123/users?env=${environment}`,
      req.body
    );
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## ❌ Error Responses

### Validation Errors
```json
{
  "code": 400,
  "message": "Validation Error",
  "errors": [
    {
      "field": "env",
      "message": "Environment must be either \"dev\" or \"prod\""
    }
  ]
}
```

### Not Found Errors
```json
{
  "code": 404,
  "message": "Plugin not found"
}
```

### Authentication Errors
```json
{
  "code": 401,
  "message": "Authentication required"
}
```

### Permission Errors
```json
{
  "code": 403,
  "message": "Insufficient permissions to access this resource"
}
```

---

## 📊 Environment Usage Summary

| Operation | Dev Default | Prod Usage | Collection Pattern |
|-----------|-------------|------------|-------------------|
| **Create** | ✅ `env=dev` | `env=prod` | `{id}-{table}_dev` / `{id}-{table}` |
| **Read** | ✅ `env=dev` | `env=prod` | `{id}-{table}_dev` / `{id}-{table}` |
| **Update** | ✅ `env=dev` | `env=prod` | `{id}-{table}_dev` / `{id}-{table}` |
| **Delete** | ✅ `env=dev` | `env=prod` | `{id}-{table}_dev` / `{id}-{table}` |
| **Tokens** | ✅ `env=dev` | `env=prod` | `{id}-{table}_dev` / `{id}-{table}` |
| **Files** | ✅ `env=dev` | `env=prod` | `{id}-drive_dev` / `{id}-drive` |
| **Emails** | ✅ `env=dev` | `env=prod` | `{id}-managedTemplate_dev` / `{id}-managedTemplate` |

All endpoints are **backward compatible** - omitting the `env` parameter defaults to development environment.
