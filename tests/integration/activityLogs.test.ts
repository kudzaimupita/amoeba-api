import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('Activity log routes', () => {
  test('GET /v1/activity-logs returns company activity logs', async () => {
    const { headers, companyId } = await registerTestUser();

    await request(app)
      .patch(`/v1/companies/${companyId}`)
      .set(headers)
      .send({ name: 'Activity Log Trigger Co' })
      .expect(httpStatus.OK);

    const response = await request(app).get('/v1/activity-logs').set(headers).expect(httpStatus.OK);

    expect(response.body.results).toEqual(expect.any(Array));
    expect(response.body.totalResults).toBeGreaterThanOrEqual(1);
  });

  test('GET /v1/activity-logs/:id returns a single log entry', async () => {
    const { headers, companyId } = await registerTestUser();

    await request(app)
      .patch(`/v1/companies/${companyId}`)
      .set(headers)
      .send({ industry: 'Testing' })
      .expect(httpStatus.OK);

    const listResponse = await request(app).get('/v1/activity-logs').set(headers).expect(httpStatus.OK);
    const activityLogId = listResponse.body.results[0].id ?? listResponse.body.results[0]._id;

    const response = await request(app).get(`/v1/activity-logs/${activityLogId}`).set(headers).expect(httpStatus.OK);

    expect(response.body._id?.toString?.() ?? response.body.id).toBeTruthy();
  });
});
