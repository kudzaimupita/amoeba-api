import { faker } from '@faker-js/faker';

import User from './user.model';

describe('User model', () => {
  test('should validate a valid user document', async () => {
    const user = new User({
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: 'password1',
      company: faker.database.mongodbObjectId(),
    });

    await expect(user.validate()).resolves.toBeUndefined();
  });

  test('should reject invalid email', async () => {
    const user = new User({
      name: faker.name.findName(),
      email: 'invalid-email',
      password: 'password1',
      company: faker.database.mongodbObjectId(),
    });

    await expect(user.validate()).rejects.toThrow();
  });

  test('should hide password in toJSON output', () => {
    const user = new User({
      name: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: 'password1',
      company: faker.database.mongodbObjectId(),
    });

    expect(user.toJSON()).not.toHaveProperty('password');
  });
});
