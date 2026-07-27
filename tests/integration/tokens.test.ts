import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';
import { loginWithOtp, registerWithOtp } from '../helpers/otp.helper';
import { faker } from '@faker-js/faker';

describe('Token routes', () => {
  test('POST /v1/tokens/logout blacklists the refresh token', async () => {
    const { headers, refreshToken } = await registerTestUser();

    await request(app).get('/v1/auth/me').set(headers).expect(httpStatus.OK);

    await request(app)
      .post('/v1/tokens/logout')
      .set({ refreshtoken: refreshToken })
      .expect(httpStatus.NO_CONTENT);

    await request(app).get('/v1/auth/me').set(headers).expect(httpStatus.UNAUTHORIZED);
  });

  test('GET /v1/tokens lists refresh tokens for authenticated user', async () => {
    const { headers, user } = await registerTestUser();

    const response = await request(app).get('/v1/tokens').set(headers).query({ type: 'refresh' }).expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.data.results.length).toBeGreaterThanOrEqual(1);
    const userId = user.id ?? user._id;
    expect(response.body.data.results.every((token: any) => token.user === userId || token.user === userId?.toString())).toBe(true);
  });

  test('rejects logout without refresh token header', async () => {
    await request(app).post('/v1/tokens/logout').expect(httpStatus.BAD_REQUEST);
  });
});

describe('Account session revoke', () => {
  test('revokes a non-current session', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    const firstSession = (await registerWithOtp(otpUser)).session;
    await loginWithOtp(otpUser.email, otpUser.password);

    const listResponse = await request(app)
      .get('/v1/account/sessions')
      .set(firstSession.headers)
      .expect(httpStatus.OK);

    expect(listResponse.body.data.length).toBeGreaterThanOrEqual(2);

    const staleSession = listResponse.body.data.find((session: any) => !session.current);
    expect(staleSession).toBeTruthy();

    await request(app)
      .delete(`/v1/account/sessions/${staleSession.id}`)
      .set(firstSession.headers)
      .expect(httpStatus.OK);

    await request(app).get('/v1/auth/me').set(firstSession.headers).expect(httpStatus.OK);
  });
});
