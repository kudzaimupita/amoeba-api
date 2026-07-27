import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';

import { app } from '../helpers/app';
import { loginWithOtp, registerWithOtp } from '../helpers/otp.helper';

describe('OTP auth flows', () => {
  test('registers via OTP confirm-register', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    const { session } = await registerWithOtp(otpUser);

    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.refreshToken).toEqual(expect.any(String));

    const me = await request(app).get('/v1/auth/me').set(session.headers).expect(httpStatus.OK);
    const email = me.body.user.email ?? me.body.user._doc?.email;
    expect(email).toBe(otpUser.email);
  });

  test('logs in via OTP confirm-login', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    await registerWithOtp(otpUser);
    const session = await loginWithOtp(otpUser.email, otpUser.password);

    expect(session.accessToken).toEqual(expect.any(String));
    await request(app).get('/v1/auth/me').set(session.headers).expect(httpStatus.OK);
  });

  test('rejects invalid OTP pin', async () => {
    const registerResponse = await request(app).post('/v1/auth/register').send({
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    });

    expect(registerResponse.body.tokenId).toBeTruthy();

    await request(app)
      .post('/v1/auth/confirm-register')
      .send({ pin: 111111, docId: registerResponse.body.tokenId })
      .expect(httpStatus.UNAUTHORIZED);
  });
});

describe('Password management', () => {
  test('changes password when authenticated', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    const { session } = await registerWithOtp(otpUser);

    await request(app)
      .patch('/v1/auth/change-password')
      .set(session.headers)
      .send({ currentPassword: 'Password1', newPassword: 'Password2!' })
      .expect(httpStatus.NO_CONTENT);

    await request(app)
      .post('/v1/auth/request-login')
      .send({ email: otpUser.email, password: 'Password1' })
      .expect(httpStatus.UNAUTHORIZED);

    await request(app).post('/v1/auth/request-login').send({ email: otpUser.email, password: 'Password2!' }).expect(httpStatus.OK);
  });

  test('forgot-password and reset-password flow', async () => {
    const email = faker.internet.email().toLowerCase();
    await registerWithOtp({ email, password: 'Password1', name: faker.name.findName() });

    await request(app).post('/v1/auth/forgot-password').send({ email }).expect(httpStatus.NO_CONTENT);

    const { getResetPasswordTokenForEmail } = await import('../helpers/otp.helper');
    const resetToken = await getResetPasswordTokenForEmail(email);

    await request(app)
      .post('/v1/auth/reset-password')
      .query({ token: resetToken })
      .send({ password: 'NewPass1' })
      .expect(httpStatus.NO_CONTENT);

    await request(app).post('/v1/auth/request-login').send({ email, password: 'NewPass1' }).expect(httpStatus.OK);
  });
});
