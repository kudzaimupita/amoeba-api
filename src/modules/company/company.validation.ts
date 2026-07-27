import Joi from 'joi';
import { objectId } from '../../utils/validate/custom.validation';

export const getCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().custom(objectId),
  }),
};

export const getCompanies = {
  query: Joi.object().keys({
    name: Joi.string(),
    industry: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
export const updateCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      description: Joi.string().email(),
      status: Joi.string(),
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
      country: Joi.string(),
      currency: Joi.string(),
      timezone: Joi.string(),
      industry: Joi.string(),
      tokenExpire: Joi.string(),
    })
    .min(1),
};

export const deleteCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().custom(objectId),
  }),
};
