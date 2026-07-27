import request from 'supertest';
import httpStatus from 'http-status';

import { app } from './app';
import { defaultTestCredentials } from './factories/user.factory';

export const authHeader = (accessToken: string, refreshToken?: string) => ({
  Authorization: `Bearer ${accessToken}`,
  ...(refreshToken ? { refreshtoken: refreshToken } : {}),
});

export const registerTestUser = async () => {
  const response = await request(app)
    .post('/v1/auth/register')
    .send(defaultTestCredentials)
    .expect(httpStatus.OK);

  expect(response.body.bypassed).toBe(true);
  expect(response.body.tokens.access.token).toEqual(expect.any(String));

  const accessToken = response.body.tokens.access.token as string;
  const refreshToken = response.body.tokens.refresh.token as string;

  return {
    user: response.body.user,
    accessToken,
    refreshToken,
    headers: authHeader(accessToken, refreshToken),
  };
};
