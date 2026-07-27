import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('Account routes', () => {
  test('GET /v1/account/sessions lists active sessions', async () => {
    const { headers } = await registerTestUser();

    const response = await request(app).get('/v1/account/sessions').set(headers).expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.some((session: any) => session.current === true)).toBe(true);
  });

  test('DELETE /v1/account/sessions/:sessionId rejects revoking the current session', async () => {
    const { headers } = await registerTestUser();

    const listResponse = await request(app).get('/v1/account/sessions').set(headers).expect(httpStatus.OK);
    const currentSession = listResponse.body.data.find((session: any) => session.current);

    expect(currentSession).toBeTruthy();

    await request(app)
      .delete(`/v1/account/sessions/${currentSession.id}`)
      .set(headers)
      .expect(httpStatus.BAD_REQUEST);
  });
});
