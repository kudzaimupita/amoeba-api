import request, { Response } from 'supertest';
import httpStatus from 'http-status';

import { app } from './app';
import { defaultTestCredentials } from './factories/user.factory';

export type AuthHeaders = Record<string, string>;

export type AuthenticatedSession = {
  user: Record<string, any>;
  accessToken: string;
  refreshToken: string;
  headers: AuthHeaders;
  companyId: string;
};

export const authHeaders = (accessToken: string, refreshToken: string): AuthHeaders => ({
  Authorization: `Bearer ${accessToken}`,
  refreshtoken: refreshToken,
});

const extractCompanyId = (user: Record<string, any>): string => {
  const company = user.company ?? user._doc?.company;
  if (!company) {
    throw new Error('Registered user is missing company context');
  }

  return typeof company === 'string' ? company : company._id?.toString() ?? company.id?.toString() ?? company.toString();
};

export const registerUser = async (
  overrides: Partial<typeof defaultTestCredentials> = {}
): Promise<{ response: Response; session: AuthenticatedSession }> => {
  const payload = { ...defaultTestCredentials, ...overrides };
  const response = await request(app).post('/v1/auth/register').send(payload);

  if (response.status !== httpStatus.OK) {
    throw new Error(`registerUser failed (${response.status}): ${JSON.stringify(response.body)}`);
  }

  const accessToken = response.body.tokens.access.token as string;
  const refreshToken = response.body.tokens.refresh.token as string;

  const session: AuthenticatedSession = {
    user: response.body.user,
    accessToken,
    refreshToken,
    headers: authHeaders(accessToken, refreshToken),
    companyId: extractCompanyId(response.body.user),
  };

  return { response, session };
};

/** Convenience helper for tests that only need an authenticated session. */
export const registerTestUser = async (): Promise<AuthenticatedSession> => {
  const { session } = await registerUser();
  return session;
};

export const loginUser = async (email = defaultTestCredentials.email, password = defaultTestCredentials.password) => {
  const response = await request(app).post('/v1/auth/login').send({ email, password });
  return response;
};
