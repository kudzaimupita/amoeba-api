import Joi from 'joi';
import { objectId } from '../../utils/validate/custom.validation';
import tokenTypes from './token.types';

const tokenTypeValues = Object.values(tokenTypes);

export const getTokens = {
  query: Joi.object().keys({
    user: Joi.string().custom(objectId),
    type: Joi.string().valid(...tokenTypeValues),
    blacklisted: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
    projectBy: Joi.string(),
  }),
};

export const getToken = {
  params: Joi.object().keys({
    tokenId: Joi.string().custom(objectId).required(),
  }),
};

export const blacklistTokens = {
  body: Joi.object().keys({
    tokenIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'At least one token ID is required',
        'array.max': 'Cannot blacklist more than 100 tokens at once',
      }),
  }),
};

export const deleteManyTokens = {
  body: Joi.object().keys({
    filter: Joi.object()
      .keys({
        user: Joi.string().custom(objectId),
        type: Joi.string().valid(...tokenTypeValues),
        blacklisted: Joi.boolean(),
        expires: Joi.object().keys({
          $lt: Joi.date(),
          $lte: Joi.date(),
          $gt: Joi.date(),
          $gte: Joi.date(),
        }),
        createdAt: Joi.object().keys({
          $lt: Joi.date(),
          $lte: Joi.date(),
          $gt: Joi.date(),
          $gte: Joi.date(),
        }),
        updatedAt: Joi.object().keys({
          $lt: Joi.date(),
          $lte: Joi.date(),
          $gt: Joi.date(),
          $gte: Joi.date(),
        }),
      })
      .min(1)
      .required()
      .messages({
        'object.min': 'Filter must contain at least one condition',
      }),
  }),
};