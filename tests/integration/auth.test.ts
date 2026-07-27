import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';
import { defaultTestCredentials } from '../helpers/factories/user.factory';
import User from '../../src/modules/user/user.model';

describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    test('should register test user and return auth tokens when TEST_EMAIL bypass is enabled', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send(defaultTestCredentials)
        .expect(httpStatus.OK);

      expect(response.body.bypassed).toBe(true);
      expect(response.body.user.email).toBe(defaultTestCredentials.email);
      expect(response.body.user.password).toBe('');
      expect(response.body.tokens.access.token).toEqual(expect.any(String));
      expect(response.body.tokens.refresh.token).toEqual(expect.any(String));

      const dbUser = await User.findOne({ email: defaultTestCredentials.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser?.company).toBeTruthy();
    });

    test('should reject invalid email', async () => {
      await request(app)
        .post('/v1/auth/register')
        .send({ ...defaultTestCredentials, email: 'not-an-email' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should reject weak password', async () => {
      await request(app)
        .post('/v1/auth/register')
        .send({ ...defaultTestCredentials, email: 'other@example.com', password: 'short' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/auth/me', () => {
    test('should return current user when authenticated', async () => {
      const { headers, user } = await registerTestUser();

      const response = await request(app).get('/v1/auth/me').set(headers).expect(httpStatus.OK);

      const email = response.body.user.email ?? response.body.user._doc?.email;
      expect(email).toBe(user.email);
    });

    test('should return 401 without token', async () => {
      await request(app).get('/v1/auth/me').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should login test user with bypass enabled', async () => {
      await registerTestUser();

      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: defaultTestCredentials.email,
          password: defaultTestCredentials.password,
        })
        .expect(httpStatus.OK);

      expect(response.body.bypassed).toBe(true);
      expect(response.body.tokens.access.token).toEqual(expect.any(String));
    });
  });
});
