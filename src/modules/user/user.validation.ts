import Joi from 'joi';
import { objectId } from '../../utils/validate/custom.validation';

const createUserBody: any = {
  email: Joi.string().required().email(),
  name: Joi.string().required(),
  permissions: Joi.array().items(Joi.string()),
};

export const createUser = {
  body: Joi.object().keys(createUserBody),
};

export const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    isDeactivated: Joi.boolean(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      // password: Joi.string().custom(password),
      name: Joi.string(),
      permissions: Joi.array().items(Joi.string()),
      status: Joi.string(),
      isDeactivated: Joi.boolean(),
    })
    .min(1),
};

export const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
