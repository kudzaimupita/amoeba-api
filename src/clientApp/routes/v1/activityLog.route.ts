/* eslint-disable prettier/prettier */
import express, { Router } from 'express';
import { validate } from '../../../utils/validate';
import { auth } from '../../../modules/auth';
import { activityLogController, activityLogValidation } from '../../../modules/activityLogs';

const router: Router = express.Router();

router
  .route('/')
  .get(auth('read', 'activityLog'), validate(activityLogValidation.getActivityLogs), activityLogController.getActivityLogs);

router
  .route('/:activityLogId')
  .get(auth('read', 'activityLog'), validate(activityLogValidation.getActivityLog), activityLogController.getActivityLog)

export default router;
