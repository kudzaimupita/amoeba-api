import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { defaultTestCredentials } from '../helpers/factories/user.factory';
import { registerTestUser, registerUser } from '../helpers/auth.helper';

describe('API error handling', () => {
  test('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/v1/does-not-exist').expect(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Not found');
  });

  test('returns 400 for malformed JSON bodies', async () => {
    await request(app)
      .post('/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ invalid json')
      .expect(httpStatus.BAD_REQUEST);
  });

  test('returns 401 for protected routes without credentials', async () => {
    await request(app).get('/v1/users').expect(httpStatus.UNAUTHORIZED);
    await request(app).get('/v1/api-keys').expect(httpStatus.UNAUTHORIZED);
    await request(app).get('/v1/account/sessions').expect(httpStatus.UNAUTHORIZED);
  });

  test('returns 400 when registering a duplicate email', async () => {
    await registerUser();

    const duplicate = await request(app).post('/v1/auth/register').send(defaultTestCredentials);

    expect(duplicate.status).toBe(httpStatus.BAD_REQUEST);
    expect(duplicate.body.message).toMatch(/already exists/i);
  });

  test('returns 401 when login password is wrong for a non-test user', async () => {
    const email = 'real-user@example.com';

    await request(app)
      .post('/v1/auth/register')
      .send({ ...defaultTestCredentials, email })
      .expect(httpStatus.OK);

    const response = await request(app)
      .post('/v1/auth/login')
      .send({ email, password: 'WrongPass1' })
      .expect(httpStatus.UNAUTHORIZED);

    expect(response.body.message).toMatch(/incorrect email or password/i);
  });

  test('rejects authenticated requests without refresh token header', async () => {
    const { accessToken } = await registerTestUser();

    await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(httpStatus.UNAUTHORIZED);
  });
});

describe('API smoke flow', () => {
  test('register → me → users → api key → company update', async () => {
    const { headers, companyId } = await registerTestUser();

    await request(app).get('/v1/auth/me').set(headers).expect(httpStatus.OK);
    await request(app).get('/v1/users').set(headers).expect(httpStatus.OK);
    await request(app).get('/v1/account/sessions').set(headers).expect(httpStatus.OK);

    const apiKey = await request(app)
      .post('/v1/api-keys')
      .set(headers)
      .send({ name: 'Smoke Key', permission: 'readonly' })
      .expect(httpStatus.CREATED);

    expect(apiKey.body.data.key).toMatch(/^sk_live_/);

    const company = await request(app)
      .patch(`/v1/companies/${companyId}`)
      .set(headers)
      .send({ industry: 'Software' })
      .expect(httpStatus.OK);

    expect(company.body.industry).toBe('Software');
  });
});
