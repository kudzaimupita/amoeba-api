import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

import User from '../../../src/modules/user/user.model';

const defaultPassword = 'Password1';

export const buildUserPayload = (overrides: Record<string, unknown> = {}) => ({
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password: defaultPassword,
  acceptedInvitation: true,
  isSystemUser: true,
  status: 'active',
  permissions: ['SYSTEM_USER'],
  isBoarded: true,
  currentTokens: 0,
  ...overrides,
});

export const insertUser = async (overrides: Record<string, unknown> = {}) => {
  const payload = buildUserPayload(overrides);
  const salt = bcrypt.genSaltSync(8);
  const hashedPassword = bcrypt.hashSync(String(payload.password), salt);

  return User.create({
    ...payload,
    password: hashedPassword,
    company: overrides.company ?? new mongoose.Types.ObjectId(),
  });
};

export const defaultTestCredentials = {
  email: 'test@example.com',
  password: 'Password1',
  name: 'Test User',
};
