import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('User routes', () => {
  test('GET /v1/users should require authentication', async () => {
    await request(app).get('/v1/users').expect(httpStatus.UNAUTHORIZED);
  });

  test('GET /v1/users should return users for authenticated system user', async () => {
    const { headers } = await registerTestUser();

    const response = await request(app).get('/v1/users').set(headers).expect(httpStatus.OK);

    expect(response.body.results).toEqual(expect.any(Array));
    expect(response.body.totalResults).toBeGreaterThanOrEqual(1);
  });

  test('POST /v1/users invites a new user', async () => {
    const { headers } = await registerTestUser();
    const invitePayload = {
      email: faker.internet.email().toLowerCase(),
      name: faker.name.findName(),
    };

    const response = await request(app).post('/v1/users').set(headers).send(invitePayload).expect(httpStatus.CREATED);

    expect(response.body.email).toBe(invitePayload.email);
    expect(response.body.name).toBe(invitePayload.name);
  });

  test('GET/PATCH/DELETE /v1/users/:userId', async () => {
    const { headers } = await registerTestUser();
    const invitePayload = {
      email: faker.internet.email().toLowerCase(),
      name: 'Invited User',
    };

    const created = await request(app).post('/v1/users').set(headers).send(invitePayload).expect(httpStatus.CREATED);
    const userId = created.body.id ?? created.body._id;

    const fetched = await request(app).get(`/v1/users/${userId}`).set(headers).expect(httpStatus.OK);
    expect(fetched.body.email ?? fetched.body._doc?.email).toBe(invitePayload.email);

    const updated = await request(app)
      .patch(`/v1/users/${userId}`)
      .set(headers)
      .send({ name: 'Updated Name' })
      .expect(httpStatus.OK);
    expect(updated.body.name ?? updated.body._doc?.name).toBe('Updated Name');

    await request(app).delete(`/v1/users/${userId}`).set(headers).expect(httpStatus.NO_CONTENT);
    await request(app).get(`/v1/users/${userId}`).set(headers).expect(httpStatus.NOT_FOUND);
  });

  test('rejects duplicate invite email', async () => {
    const { headers } = await registerTestUser();
    const email = faker.internet.email().toLowerCase();

    await request(app).post('/v1/users').set(headers).send({ email, name: 'User One' }).expect(httpStatus.CREATED);
    await request(app)
      .post('/v1/users')
      .set(headers)
      .send({ email, name: 'User Two' })
      .expect(httpStatus.BAD_REQUEST);
  });
});
