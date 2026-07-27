import express from 'express';
import Joi from 'joi';
import { auth } from '../auth';
import { validate } from '../../utils/validate';
import * as controller from './account.controller';

const route = express.Router();

route.get('/sessions', auth(), controller.listSessions);
route.delete(
  '/sessions/:sessionId',
  auth(),
  validate({ params: Joi.object({ sessionId: Joi.string().hex().length(24).required() }) }),
  controller.revokeSession
);

export default route;
