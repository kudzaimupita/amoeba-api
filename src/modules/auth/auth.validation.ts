import Joi from 'joi';
import { password } from '../../utils/validate/custom.validation';

export const requestRegisterBody: any = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
};

export const confirmRegisterBody: any = {
  pin: Joi.number().required(),
  docId: Joi.string().required(),
};

export const requestLoginBody: any = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
};

export const confirmLoginBody: any = {
  pin: Joi.number().required(),
  docId: Joi.string().required(),
};

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

export const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const resendRequestLogin = {
  body: Joi.object().keys({
    docId: Joi.string().required(),
  }),
};

export const linkOAuthProvider = {
  body: Joi.object().keys({
    provider: Joi.string().valid('google', 'github').required(),
    code: Joi.string().required(),
  }),
};

export const unlinkOAuthProvider = {
  params: Joi.object().keys({
    provider: Joi.string().valid('google', 'github').required(),
  }),
};

export const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required().custom(password),
    newPassword: Joi.string().required().custom(password),
  }),
};
