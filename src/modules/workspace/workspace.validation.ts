import Joi from 'joi';
import { objectId } from '../../utils/validate/custom.validation';
import { WORKSPACE_ROLES } from './workspace.constants';

export const createWorkspace = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(120).required(),
  }),
};

export const workspaceIdParam = {
  params: Joi.object().keys({
    workspaceId: Joi.string().custom(objectId).required(),
  }),
};

export const switchWorkspace = workspaceIdParam;

export const inviteMember = {
  ...workspaceIdParam,
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    role: Joi.string()
      .valid(...WORKSPACE_ROLES.filter((role) => role !== 'owner'))
      .default('member'),
  }),
};

export const updateMemberRole = {
  params: Joi.object().keys({
    workspaceId: Joi.string().custom(objectId).required(),
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    role: Joi.string()
      .valid(...WORKSPACE_ROLES.filter((role) => role !== 'owner'))
      .required(),
  }),
};

export const removeMember = {
  params: Joi.object().keys({
    workspaceId: Joi.string().custom(objectId).required(),
    userId: Joi.string().custom(objectId).required(),
  }),
};

export const invitationIdParam = {
  params: Joi.object().keys({
    workspaceId: Joi.string().custom(objectId).required(),
    invitationId: Joi.string().custom(objectId).required(),
  }),
};

export const acceptInvitation = {
  body: Joi.object().keys({
    token: Joi.string().min(32).required(),
  }),
};

export const previewInvitation = {
  params: Joi.object().keys({
    token: Joi.string().min(32).required(),
  }),
};

export const updateWorkspace = {
  ...workspaceIdParam,
  body: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(120),
      industry: Joi.string(),
      description: Joi.string(),
    })
    .min(1),
};
