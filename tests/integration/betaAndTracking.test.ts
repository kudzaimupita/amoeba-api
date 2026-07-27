import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('Beta user routes', () => {
  test('POST /v1/beta-users/join-waitlist is public', async () => {
    const email = faker.internet.email().toLowerCase();

    const response = await request(app)
      .post('/v1/beta-users/join-waitlist')
      .send({ email, firstName: 'Beta', lastName: 'User', company: 'Acme' })
      .expect(httpStatus.CREATED);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(email);
  });

  test('POST /v1/beta-users/check-status/:email is public', async () => {
    const email = faker.internet.email().toLowerCase();

    await request(app).post('/v1/beta-users/join-waitlist').send({ email }).expect(httpStatus.CREATED);

    const response = await request(app).post(`/v1/beta-users/check-status/${encodeURIComponent(email)}`).expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
  });

  test('admin beta routes require authentication', async () => {
    await request(app).get('/v1/beta-users/waitlist').expect(httpStatus.UNAUTHORIZED);
  });

  test('GET /v1/beta-users/waitlist works for authenticated system user', async () => {
    const { headers } = await registerTestUser();

    const response = await request(app).get('/v1/beta-users/waitlist').set(headers).expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Session tracking routes', () => {
  test('POST /v1/tracking/start creates a public session', async () => {
    const response = await request(app)
      .post('/v1/tracking/start')
      .send({
        anonymousId: `anon-${Date.now()}`,
        landingPage: '/',
        referrer: 'https://example.com',
      })
      .expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.sessionId).toEqual(expect.any(String));
  });

  test('GET /v1/tracking/session/by-ip is public', async () => {
    const response = await request(app).get('/v1/tracking/session/by-ip').expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.sessionId).toEqual(expect.any(String));
  });
});
