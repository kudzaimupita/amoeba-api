#!/usr/bin/env node
/**
 * Generates postman/Amoeba-API.postman_collection.json
 * Run: node postman/generate-collection.mjs
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const authHeaders = [
  { key: 'Authorization', value: 'Bearer {{accessToken}}' },
  { key: 'refreshtoken', value: '{{refreshToken}}' },
];

const apiKeyHeader = [{ key: 'x-api-key', value: '{{apiKey}}' }];

const saveTokensScript = {
  exec: [
    "const json = pm.response.json();",
    "if (json.tokens) {",
    "  pm.collectionVariables.set('accessToken', json.tokens.access.token);",
    "  pm.collectionVariables.set('refreshToken', json.tokens.refresh.token);",
    "}",
    "if (json.user) {",
    "  const user = json.user._doc || json.user;",
    "  pm.collectionVariables.set('userId', user.id || user._id);",
    "  const company = user.company;",
    "  if (company) pm.collectionVariables.set('companyId', company._id || company.id || company);",
    "}",
    "if (json.tokenId) pm.collectionVariables.set('otpDocId', json.tokenId);",
    "if (json.data?.key) pm.collectionVariables.set('apiKey', json.data.key);",
    "if (json.data?.id) pm.collectionVariables.set('apiKeyId', json.data.id);",
  ],
  type: 'text/javascript',
};

function req(name, method, path, opts = {}) {
  const headers = [...(opts.auth ? authHeaders : []), ...(opts.apiKey ? apiKeyHeader : []), ...(opts.headers || [])];
  const item = {
    name,
    request: {
      method,
      header: headers,
      url: {
        raw: `{{baseUrl}}${path}`,
        host: ['{{baseUrl}}'],
        path: path.replace(/^\//, '').split('/'),
        ...(opts.query ? { query: opts.query } : {}),
      },
      ...(opts.body ? { body: { mode: 'raw', raw: JSON.stringify(opts.body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      description: opts.description || '',
    },
  };
  if (opts.test) item.event = [{ listen: 'test', script: saveTokensScript }];
  return item;
}

const routes = [
  {
    name: 'Health',
    item: [req('Health Check', 'GET', '/health')],
  },
  {
    name: 'Auth',
    item: [
      req('Register (TEST_EMAIL bypass)', 'POST', '/v1/auth/register', {
        body: { name: 'Test User', email: '{{testEmail}}', password: 'Password1' },
        test: true,
        description: 'Uses TEST_EMAIL env bypass when email matches server TEST_EMAIL.',
      }),
      req('Login (TEST_EMAIL bypass)', 'POST', '/v1/auth/login', {
        body: { email: '{{testEmail}}', password: 'Password1' },
        test: true,
      }),
      req('Request Register (OTP)', 'POST', '/v1/auth/register', {
        body: { name: 'New User', email: 'user@example.com', password: 'Password1' },
        test: true,
      }),
      req('Confirm Register (OTP)', 'POST', '/v1/auth/confirm-register', {
        body: { pin: 123456, docId: '{{otpDocId}}' },
        test: true,
      }),
      req('Request Login (OTP)', 'POST', '/v1/auth/request-login', {
        body: { email: 'user@example.com', password: 'Password1' },
        test: true,
      }),
      req('Confirm Login (OTP)', 'POST', '/v1/auth/confirm-login', {
        body: { pin: 123456, docId: '{{otpDocId}}' },
        test: true,
      }),
      req('Get Me', 'GET', '/v1/auth/me', { auth: true }),
      req('Forgot Password', 'POST', '/v1/auth/forgot-password', { body: { email: '{{testEmail}}' } }),
      req('Reset Password', 'POST', '/v1/auth/reset-password', {
        query: [{ key: 'token', value: '{{resetToken}}' }],
        body: { password: 'NewPass1' },
      }),
      req('Resend Login OTP', 'POST', '/v1/auth/resend-request-login', { body: { docId: '{{otpDocId}}' } }),
      req('Change Password', 'PATCH', '/v1/auth/change-password', {
        auth: true,
        body: { currentPassword: 'Password1', newPassword: 'Password2' },
      }),
      req('Linked Providers', 'GET', '/v1/auth/linked-providers', { auth: true }),
      req('Link OAuth Provider', 'POST', '/v1/auth/link-oauth', { auth: true, body: { provider: 'google', code: 'oauth-code' } }),
      req('Unlink OAuth Provider', 'DELETE', '/v1/auth/unlink-oauth/google', { auth: true }),
      req('Google OAuth Start', 'GET', '/v1/auth/google', { description: 'Browser redirect flow.' }),
      req('Google OAuth Callback', 'GET', '/v1/auth/google/callback', { description: 'Browser redirect callback.' }),
      req('GitHub OAuth Start', 'GET', '/v1/auth/github'),
      req('GitHub OAuth Callback', 'GET', '/v1/auth/github/callback'),
      req('GitLab OAuth (501)', 'GET', '/v1/auth/gitlab', { auth: true }),
      req('Bitbucket OAuth (501)', 'GET', '/v1/auth/bitbucket', { auth: true }),
      req('Figma OAuth Initiate', 'GET', '/v1/auth/figma/initiate', { auth: true }),
      req('Figma OAuth Callback', 'GET', '/v1/auth/figma/callback'),
      req('Figma OAuth Status', 'GET', '/v1/auth/figma/status', { auth: true }),
      req('Figma Disconnect', 'DELETE', '/v1/auth/figma/disconnect', { auth: true }),
      req('Claude OAuth Initiate', 'GET', '/v1/auth/claude/initiate', { auth: true }),
      req('Claude OAuth Status', 'GET', '/v1/auth/claude/status', { auth: true }),
      req('Claude Disconnect', 'DELETE', '/v1/auth/claude/disconnect', { auth: true }),
      req('Atlassian OAuth Initiate', 'GET', '/v1/auth/atlassian/initiate', { auth: true }),
      req('Atlassian OAuth Callback', 'GET', '/v1/auth/atlassian/callback'),
      req('Atlassian OAuth Status', 'GET', '/v1/auth/atlassian/status', { auth: true }),
      req('Atlassian Disconnect', 'DELETE', '/v1/auth/atlassian/disconnect', { auth: true }),
    ],
  },
  {
    name: 'Users',
    item: [
      req('List Users', 'GET', '/v1/users', { auth: true }),
      req('Invite User', 'POST', '/v1/users', { auth: true, body: { email: 'invite@example.com', name: 'Invited User' } }),
      req('User Analytics', 'GET', '/v1/users/analytics', { auth: true }),
      req('Get User', 'GET', '/v1/users/{{userId}}', { auth: true }),
      req('Update User', 'PATCH', '/v1/users/{{userId}}', { auth: true, body: { name: 'Updated Name' } }),
      req('Delete User', 'DELETE', '/v1/users/{{userId}}', { auth: true }),
      req('Fix User Acceptance', 'PATCH', '/v1/users/{{userId}}/fix-acceptance', { auth: true }),
    ],
  },
  {
    name: 'Companies',
    item: [
      req('Create / Store Company', 'POST', '/v1/companies', { auth: true, body: { name: 'My Company' } }),
      req('Get Plans (public)', 'GET', '/v1/companies/plans'),
      req('Get Company', 'GET', '/v1/companies/{{companyId}}', { auth: true }),
      req('Update Company', 'PATCH', '/v1/companies/{{companyId}}', { auth: true, body: { name: 'Amoeba Labs', industry: 'Software' } }),
      req('Delete Company', 'DELETE', '/v1/companies/{{companyId}}', { auth: true }),
      req('Initiate Payment', 'POST', '/v1/companies/initiate-payment', { auth: true, body: {} }),
      req('Top Up', 'POST', '/v1/companies/top-up', { auth: true, body: {} }),
      req('Transactions', 'GET', '/v1/companies/transactions', { auth: true }),
      req('Change Plans', 'POST', '/v1/companies/change-plans', { auth: true, body: {} }),
      req('Cancel Plan', 'POST', '/v1/companies/cancel-plan', { auth: true, body: {} }),
      req('Payment Webhook Verify', 'POST', '/v1/companies/webhook/verify', { body: {} }),
    ],
  },
  {
    name: 'Activity Logs',
    item: [
      req('List Activity Logs', 'GET', '/v1/activity-logs', { auth: true }),
      req('Get Activity Log', 'GET', '/v1/activity-logs/{{activityLogId}}', { auth: true }),
    ],
  },
  {
    name: 'Beta Users',
    item: [
      req('Join Waitlist (public)', 'POST', '/v1/beta-users/join-waitlist', {
        body: { email: 'beta@example.com', firstName: 'Beta', lastName: 'User', company: 'Acme' },
      }),
      req('Check Whitelist Status (public)', 'POST', '/v1/beta-users/check-status/beta@example.com'),
      req('Create Beta User', 'POST', '/v1/beta-users', { body: { email: 'beta@example.com' } }),
      req('List Beta Users', 'GET', '/v1/beta-users', { auth: true }),
      req('Get Waitlist', 'GET', '/v1/beta-users/waitlist', { auth: true }),
      req('Get Whitelisted', 'GET', '/v1/beta-users/whitelisted', { auth: true }),
      req('Waitlist Stats', 'GET', '/v1/beta-users/stats', { auth: true }),
      req('Whitelist User', 'POST', '/v1/beta-users/whitelist/beta@example.com', { auth: true }),
      req('Remove Whitelist', 'POST', '/v1/beta-users/remove-whitelist/beta@example.com', { auth: true }),
      req('Delete Beta User', 'DELETE', '/v1/beta-users/beta@example.com', { auth: true }),
      req('Test Early Access Email', 'POST', '/v1/beta-users/test-early-access-email', { auth: true, body: { email: 'beta@example.com' } }),
    ],
  },
  {
    name: 'Tokens',
    item: [
      req('List Tokens', 'GET', '/v1/tokens', { auth: true, query: [{ key: 'type', value: 'refresh' }] }),
      req('Get Token', 'GET', '/v1/tokens/{{tokenId}}', { auth: true }),
      req('Token Stats (admin)', 'GET', '/v1/tokens/stats', { auth: true }),
      req('Cleanup Expired Tokens (admin)', 'DELETE', '/v1/tokens/cleanup', { auth: true }),
      req('Logout', 'POST', '/v1/tokens/logout', { headers: [{ key: 'refreshtoken', value: '{{refreshToken}}' }] }),
      req('Blacklist Tokens', 'PATCH', '/v1/tokens/blacklist', { auth: true, body: { tokenIds: ['{{tokenId}}'] } }),
      req('Delete Many Tokens', 'DELETE', '/v1/tokens/delete-many', { auth: true, body: { filter: { type: 'refresh' } } }),
    ],
  },
  {
    name: 'API Keys',
    item: [
      req('Create API Key', 'POST', '/v1/api-keys', {
        auth: true,
        body: { name: 'My API Key', permission: 'admin' },
        test: true,
      }),
      req('List API Keys', 'GET', '/v1/api-keys', { auth: true }),
      req('Get API Key', 'GET', '/v1/api-keys/{{apiKeyId}}', { auth: true }),
      req('Update API Key', 'PATCH', '/v1/api-keys/{{apiKeyId}}', { auth: true, body: { name: 'Renamed Key' } }),
      req('Delete API Key', 'DELETE', '/v1/api-keys/{{apiKeyId}}', { auth: true }),
      req('Use API Key (example)', 'GET', '/v1/users', { apiKey: true }),
    ],
  },
  {
    name: 'Account',
    item: [
      req('List Sessions', 'GET', '/v1/account/sessions', { auth: true }),
      req('Revoke Session', 'DELETE', '/v1/account/sessions/{{sessionId}}', { auth: true }),
    ],
  },
  {
    name: 'Admin',
    item: [
      req('Admin List Companies', 'GET', '/v1/admin/companies', { auth: true }),
      req('Admin Create Company Query', 'POST', '/v1/admin/companies', { auth: true }),
      req('Admin Get Company', 'GET', '/v1/admin/companies/{{companyId}}', { auth: true }),
      req('Admin Update Company', 'PATCH', '/v1/admin/companies/{{companyId}}', { auth: true, body: { name: 'Admin Updated' } }),
      req('Admin Delete Company', 'DELETE', '/v1/admin/companies/{{companyId}}', { auth: true }),
      req('Admin List Users', 'GET', '/v1/admin/users', { auth: true }),
      req('Admin Get Waitlist', 'POST', '/v1/admin/waitlist/get-waitlist', { body: { page: 1, limit: 50 } }),
      req('Admin Get Whitelisted', 'POST', '/v1/admin/waitlist/get-whitelisted', { body: { page: 1, limit: 50 } }),
      req('Admin Waitlist Stats', 'POST', '/v1/admin/waitlist/stats'),
      req('Admin Whitelist Email', 'POST', '/v1/admin/waitlist/whitelist/beta@example.com'),
      req('Admin Remove Whitelist', 'POST', '/v1/admin/waitlist/remove-whitelist/beta@example.com'),
      req('Admin Delete Waitlist User', 'POST', '/v1/admin/waitlist/delete/beta@example.com'),
      req('Admin Check Status', 'POST', '/v1/admin/waitlist/check-status/beta@example.com'),
    ],
  },
  {
    name: 'Session Tracking',
    item: [
      req('Get or Create Session by IP', 'GET', '/v1/tracking/session/by-ip'),
      req('Start Session', 'POST', '/v1/tracking/start', {
        body: { anonymousId: 'anon-123', landingPage: '/', referrer: 'https://example.com' },
      }),
      req('Record Event', 'POST', '/v1/tracking/event', { body: { sessionId: '{{trackingSessionId}}', event: 'page_view' } }),
      req('Save Data Backup', 'POST', '/v1/tracking/backup', { body: { sessionId: '{{trackingSessionId}}', data: {} } }),
      req('Get Data Backup', 'GET', '/v1/tracking/backup/{{trackingSessionId}}'),
      req('Clear Data Backup', 'DELETE', '/v1/tracking/backup/{{trackingSessionId}}'),
      req('Get Session', 'GET', '/v1/tracking/session/{{trackingSessionId}}'),
      req('Get User Sessions', 'GET', '/v1/tracking/user/{{anonymousId}}', { auth: true }),
      req('Get Sessions by IP', 'GET', '/v1/tracking/ip', { auth: true }),
      req('Dwell Analytics', 'GET', '/v1/tracking/analytics/dwell', { auth: true }),
    ],
  },
  {
    name: 'Docs (development only)',
    item: [req('Swagger UI', 'GET', '/v1/docs', { description: 'Only available when NODE_ENV=development' })],
  },
  {
    name: 'API v1 Mirror',
    item: [
      req('Health (mirror)', 'GET', '/api/v1/auth/me', { auth: true, description: '/api/v1 mirrors /v1 routes' }),
    ],
  },
];

const collection = {
  info: {
    name: 'Amoeba API',
    description:
      'Complete Postman collection for Amoeba API mounted routes.\n\n1. Set `baseUrl` (default http://localhost:3001)\n2. Run **Register (TEST_EMAIL bypass)** or **Login** to populate `accessToken` and `refreshToken`\n3. Protected routes require both Authorization and refreshtoken headers',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3001' },
    { key: 'testEmail', value: 'test@example.com' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'userId', value: '' },
    { key: 'companyId', value: '' },
    { key: 'apiKeyId', value: '' },
    { key: 'apiKey', value: '' },
    { key: 'otpDocId', value: '' },
    { key: 'resetToken', value: '' },
    { key: 'tokenId', value: '' },
    { key: 'sessionId', value: '' },
    { key: 'activityLogId', value: '' },
    { key: 'trackingSessionId', value: '' },
    { key: 'anonymousId', value: 'anon-123' },
  ],
  item: routes,
};

const environment = {
  name: 'Amoeba API — Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3001', enabled: true },
    { key: 'testEmail', value: 'test@example.com', enabled: true },
    { key: 'accessToken', value: '', enabled: true },
    { key: 'refreshToken', value: '', enabled: true },
    { key: 'userId', value: '', enabled: true },
    { key: 'companyId', value: '', enabled: true },
    { key: 'apiKey', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

writeFileSync(join(__dirname, 'Amoeba-API.postman_collection.json'), JSON.stringify(collection, null, 2));
writeFileSync(join(__dirname, 'Amoeba-API.local.postman_environment.json'), JSON.stringify(environment, null, 2));
console.log('Generated postman/Amoeba-API.postman_collection.json');
console.log('Generated postman/Amoeba-API.local.postman_environment.json');
