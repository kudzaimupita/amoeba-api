import request from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';

import { app } from '../helpers/app';
import { registerTestUser } from '../helpers/auth.helper';

describe('Workspace routes', () => {
  test('lists workspaces for authenticated user', async () => {
    const { headers } = await registerTestUser();

    const response = await request(app).get('/v1/workspaces').set(headers).expect(httpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.activeWorkspaceId).toEqual(expect.any(String));
  });

  test('creates a second workspace and switches into it', async () => {
    const { headers } = await registerTestUser();

    const createResponse = await request(app)
      .post('/v1/workspaces')
      .set(headers)
      .send({ name: 'Second Workspace' })
      .expect(httpStatus.CREATED);

    const workspaceId = createResponse.body.data.id ?? createResponse.body.data._id;
    expect(workspaceId).toBeTruthy();

    const switchResponse = await request(app)
      .post(`/v1/workspaces/${workspaceId}/switch`)
      .set(headers)
      .expect(httpStatus.OK);

    expect(switchResponse.body.data.workspaceId).toBe(workspaceId);
    expect(switchResponse.body.data.tokens.access.token).toEqual(expect.any(String));

    const listResponse = await request(app).get('/v1/workspaces').set(headers).expect(httpStatus.OK);
    expect(listResponse.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('invites an existing-style member flow via workspace invitation', async () => {
    const { headers } = await registerTestUser();
    const inviteEmail = faker.internet.email().toLowerCase();

    const inviteResponse = await request(app)
      .post(`/v1/workspaces/${(await request(app).get('/v1/workspaces').set(headers)).body.data[0].id}/invitations`)
      .set(headers)
      .send({ email: inviteEmail, role: 'member' })
      .expect(httpStatus.CREATED);

    expect(inviteResponse.body.data.email).toBe(inviteEmail);
    expect(inviteResponse.body.data.inviteLink).toMatch(/accept-invite\?token=/);
  });

  test('accepts invitation for a newly registered user', async () => {
    const owner = await registerTestUser();
    const inviteEmail = faker.internet.email().toLowerCase();

    const workspaceId = (await request(app).get('/v1/workspaces').set(owner.headers)).body.data[0].id;

    const inviteResponse = await request(app)
      .post(`/v1/workspaces/${workspaceId}/invitations`)
      .set(owner.headers)
      .send({ email: inviteEmail, role: 'member' })
      .expect(httpStatus.CREATED);

    const token = new URL(inviteResponse.body.data.inviteLink).searchParams.get('token');
    expect(token).toBeTruthy();

    const { registerWithOtp } = await import('../helpers/otp.helper');
    const { session: inviteeSession } = await registerWithOtp({
      email: inviteEmail,
      password: 'Password1',
      name: faker.name.findName(),
    });

    const acceptResponse = await request(app)
      .post('/v1/workspaces/invitations/accept')
      .set(inviteeSession.headers)
      .send({ token })
      .expect(httpStatus.OK);

    expect(acceptResponse.body.data.workspaceId).toBe(workspaceId);
    expect(acceptResponse.body.data.role).toBe('member');

    const memberList = await request(app)
      .get(`/v1/workspaces/${workspaceId}/members`)
      .set(owner.headers)
      .expect(httpStatus.OK);

    expect(memberList.body.data.some((member: any) => member.email === inviteEmail)).toBe(true);
  });
});
