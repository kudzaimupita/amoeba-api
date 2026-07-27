import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';

import { app } from '../helpers/app';
import { getPinFromTokenId, registerWithOtp } from '../helpers/otp.helper';

describe('Recovery codes', () => {
  test('generates, summarizes, and revokes recovery codes', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    const { session } = await registerWithOtp(otpUser);

    const generateResponse = await request(app)
      .post('/v1/account/recovery-codes')
      .set(session.headers)
      .send({ password: otpUser.password })
      .expect(httpStatus.CREATED);

    expect(generateResponse.body.data.codes).toHaveLength(10);
    expect(generateResponse.body.data.remaining).toBe(10);

    const summaryResponse = await request(app).get('/v1/account/recovery-codes').set(session.headers).expect(httpStatus.OK);
    expect(summaryResponse.body.data.remaining).toBe(10);

    await request(app)
      .delete('/v1/account/recovery-codes')
      .set(session.headers)
      .send({ password: otpUser.password })
      .expect(httpStatus.OK);

    const afterRevoke = await request(app).get('/v1/account/recovery-codes').set(session.headers).expect(httpStatus.OK);
    expect(afterRevoke.body.data.remaining).toBe(0);
  });

  test('allows login with a recovery code instead of OTP pin', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    const { session } = await registerWithOtp(otpUser);

    const generated = await request(app)
      .post('/v1/account/recovery-codes')
      .set(session.headers)
      .send({ password: otpUser.password })
      .expect(httpStatus.CREATED);

    const recoveryCode = generated.body.data.codes[0] as string;

    const loginResponse = await request(app)
      .post('/v1/auth/request-login')
      .send({ email: otpUser.email, password: otpUser.password })
      .expect(httpStatus.OK);

    const confirmResponse = await request(app)
      .post('/v1/auth/confirm-login')
      .send({ docId: loginResponse.body.tokenId, recoveryCode })
      .expect(httpStatus.OK);

    expect(confirmResponse.body.tokens.access.token).toEqual(expect.any(String));

    const loginAgain = await request(app)
      .post('/v1/auth/request-login')
      .send({ email: otpUser.email, password: otpUser.password })
      .expect(httpStatus.OK);

    await request(app)
      .post('/v1/auth/confirm-login')
      .send({ docId: loginAgain.body.tokenId, recoveryCode })
      .expect(httpStatus.UNAUTHORIZED);
  });

  test('rejects invalid recovery codes at login', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    await registerWithOtp(otpUser);

    const loginResponse = await request(app)
      .post('/v1/auth/request-login')
      .send({ email: otpUser.email, password: otpUser.password })
      .expect(httpStatus.OK);

    await request(app)
      .post('/v1/auth/confirm-login')
      .send({ docId: loginResponse.body.tokenId, recoveryCode: 'ZZZZ-ZZZZ' })
      .expect(httpStatus.UNAUTHORIZED);
  });

  test('still supports OTP login when pin is provided', async () => {
    const otpUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Password1',
      name: faker.name.findName(),
    };

    await registerWithOtp(otpUser);

    const loginResponse = await request(app)
      .post('/v1/auth/request-login')
      .send({ email: otpUser.email, password: otpUser.password })
      .expect(httpStatus.OK);

    const pin = await getPinFromTokenId(loginResponse.body.tokenId);

    await request(app).post('/v1/auth/confirm-login').send({ docId: loginResponse.body.tokenId, pin }).expect(httpStatus.OK);
  });
});
