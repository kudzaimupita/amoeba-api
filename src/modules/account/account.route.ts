import express from 'express';
import Joi from 'joi';
import { auth } from '../auth';
import { validate } from '../../utils/validate';
import * as controller from './account.controller';
import * as accountValidation from './account.validation';

const route = express.Router();

route.get('/sessions', auth(), controller.listSessions);
route.delete(
  '/sessions/:sessionId',
  auth(),
  validate({ params: Joi.object({ sessionId: Joi.string().hex().length(24).required() }) }),
  controller.revokeSession
);

route.get('/recovery-codes', auth(), controller.getRecoveryCodes);
route.post('/recovery-codes', auth(), validate(accountValidation.generateRecoveryCodes), controller.generateRecoveryCodes);
route.delete('/recovery-codes', auth(), validate(accountValidation.revokeRecoveryCodes), controller.revokeRecoveryCodes);

export default route;
