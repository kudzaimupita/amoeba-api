import Joi from 'joi';
import { objectId } from '../../utils/validate/custom.validation';

export const getActivityLogs = {
  query: Joi.object().keys({
    name: Joi.string(),
    resourceType: Joi.string(),
    resourceId: Joi.string(),
    action: Joi.string(),
    actionBy: Joi.string(),
    statusCode: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getActivityLog = {
  params: Joi.object().keys({
    activityLogId: Joi.string().custom(objectId),
  }),
};
