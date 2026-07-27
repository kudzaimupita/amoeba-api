import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

import Company from '../../../src/modules/company/company.model';

export const buildCompanyPayload = (overrides: Record<string, unknown> = {}) => ({
  name: `${faker.company.companyName()} Workspace`,
  email: faker.internet.email().toLowerCase(),
  systemUser: new mongoose.Types.ObjectId(),
  billing: {
    plan: 'free',
    paystackCustomerId: null,
  },
  ...overrides,
});

export const insertCompany = async (overrides: Record<string, unknown> = {}) => Company.create(buildCompanyPayload(overrides));
