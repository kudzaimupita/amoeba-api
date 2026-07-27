import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('Company routes', () => {
  test('GET /v1/companies/:companyId returns the authenticated company', async () => {
    const { headers, companyId } = await registerTestUser();

    const response = await request(app).get(`/v1/companies/${companyId}`).set(headers).expect(httpStatus.OK);

    expect(response.body._id?.toString?.() ?? response.body.id).toBeTruthy();
    expect(response.body.name).toEqual(expect.any(String));
  });

  test('PATCH /v1/companies/:companyId updates company profile', async () => {
    const { headers, companyId } = await registerTestUser();

    const response = await request(app)
      .patch(`/v1/companies/${companyId}`)
      .set(headers)
      .send({ name: 'Amoeba Labs' })
      .expect(httpStatus.OK);

    expect(response.body.name).toBe('Amoeba Labs');
  });

  test('GET /v1/companies/plans is publicly accessible', async () => {
    await request(app).get('/v1/companies/plans').expect(httpStatus.OK);
  });
});
