import Joi from 'joi';

export const createApiKey = {
    body: Joi.object().keys({
        name: Joi.string().required().max(100).trim(),
        permission: Joi.string().valid('admin', 'readonly').required(),
        expiresAt: Joi.date().greater('now').optional(),
        allowedIPs: Joi.array().items(Joi.string().ip()).optional(),
        rateLimit: Joi.number().min(1).max(10000).optional(),
    }),
};

export const getApiKeys = {
    query: Joi.object().keys({
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

export const getApiKey = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

export const updateApiKey = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string().max(100).trim(),
            isActive: Joi.boolean(),
            allowedIPs: Joi.array().items(Joi.string().ip()),
            rateLimit: Joi.number().min(1).max(10000),
        })
        .min(1),
};

export const deleteApiKey = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};
