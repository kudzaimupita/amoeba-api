jest.mock('../../src/modules/comms/internal', () =>
  jest.fn().mockImplementation(() => ({
    sendOTP: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetNotification: jest.fn().mockResolvedValue(undefined),
    sendLoginNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendUserInviteEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordUpdateNotificationEmail: jest.fn().mockResolvedValue(undefined),
  }))
);

jest.mock('../../src/modules/company/payStackService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ data: { customer_code: 'test_customer' } }),
  initiateTransaction: jest.fn(),
  verifyTransaction: jest.fn(),
  getAllPlans: jest.fn().mockResolvedValue([]),
}));

import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../helpers/db';

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await disconnectTestDatabase();
});
