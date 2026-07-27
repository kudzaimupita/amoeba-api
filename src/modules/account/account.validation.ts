import Joi from 'joi';
import { password } from '../../utils/validate/custom.validation';

export const generateRecoveryCodes = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

export const revokeRecoveryCodes = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};
