import request from 'supertest';
import httpStatus from 'http-status';

import { app } from '../helpers/app';

describe('Health routes', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app).get('/health').expect(httpStatus.OK);

    expect(response.body).toMatchObject({
      status: 'healthy',
      environment: 'test',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.body.uptime).toEqual(expect.any(Number));
  });
});
