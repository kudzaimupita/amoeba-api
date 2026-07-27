import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('API key routes', () => {
  test('creates, lists, reads, updates, and deletes an API key', async () => {
    const { headers } = await registerTestUser();

    const createResponse = await request(app)
      .post('/v1/api-keys')
      .set(headers)
      .send({ name: 'CI Key', permission: 'admin' })
      .expect(httpStatus.CREATED);

    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.key).toMatch(/^sk_live_/);
    const apiKeyId = createResponse.body.data.id;
    const plainKey = createResponse.body.data.key as string;

    const listResponse = await request(app).get('/v1/api-keys').set(headers).expect(httpStatus.OK);
    expect(listResponse.body.data.totalResults).toBeGreaterThanOrEqual(1);

    await request(app).get(`/v1/api-keys/${apiKeyId}`).set(headers).expect(httpStatus.OK);

    const updateResponse = await request(app)
      .patch(`/v1/api-keys/${apiKeyId}`)
      .set(headers)
      .send({ name: 'Renamed CI Key' })
      .expect(httpStatus.OK);
    expect(updateResponse.body.data.name).toBe('Renamed CI Key');

    await request(app).delete(`/v1/api-keys/${apiKeyId}`).set(headers).expect(httpStatus.NO_CONTENT);

    await request(app).get(`/v1/api-keys/${apiKeyId}`).set(headers).expect(httpStatus.NOT_FOUND);

    // Readonly key can authenticate for read-only routes
    const readonlyResponse = await request(app)
      .post('/v1/api-keys')
      .set(headers)
      .send({ name: 'Readonly Key', permission: 'readonly' })
      .expect(httpStatus.CREATED);

    const readonlyPlainKey = readonlyResponse.body.data.key as string;
    await request(app).get('/v1/users').set('x-api-key', readonlyPlainKey).expect(httpStatus.OK);

    await request(app)
      .post('/v1/api-keys')
      .set('x-api-key', readonlyPlainKey)
      .send({ name: 'Should Fail', permission: 'admin' })
      .expect(httpStatus.FORBIDDEN);
  });

  test('rejects invalid API key payloads', async () => {
    const { headers } = await registerTestUser();

    await request(app)
      .post('/v1/api-keys')
      .set(headers)
      .send({ name: '', permission: 'admin' })
      .expect(httpStatus.BAD_REQUEST);
  });

  test('rejects requests with invalid API keys', async () => {
    await request(app).get('/v1/users').set('x-api-key', 'sk_live_invalid').expect(httpStatus.UNAUTHORIZED);
  });
});
