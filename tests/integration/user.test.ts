import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('User routes', () => {
  test('GET /v1/users should require authentication', async () => {
    await request(app).get('/v1/users').expect(httpStatus.UNAUTHORIZED);
  });

  test('GET /v1/users should return users for authenticated system user', async () => {
    const { headers } = await registerTestUser();

    const response = await request(app).get('/v1/users').set(headers).expect(httpStatus.OK);

    expect(response.body.results).toEqual(expect.any(Array));
    expect(response.body.totalResults).toBeGreaterThanOrEqual(1);
  });
});
