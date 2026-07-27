/* eslint-disable import/prefer-default-export */

/* eslint-disable prettier/prettier */

import Joi from 'joi';

export const betaUserValidation = {
  createBetaUser: {
    body: Joi.object().keys({
      email: Joi.string().email().required(),
      firstName: Joi.string().trim().optional(),
      lastName: Joi.string().trim().optional(),
      company: Joi.string().trim().optional(),
      source: Joi.string().trim().optional(),
    }),
  },
  getBetaUsers: {
    query: Joi.object().keys({
      page: Joi.number().min(1).optional(),
      limit: Joi.number().min(1).max(100).optional(),
      verified: Joi.boolean().optional(),
    }),
  },
};
