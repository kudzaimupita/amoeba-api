import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../../utils';
import { ApiError } from '../../utils/errors';
import { IOptions } from '../../utils/paginate/paginate';
import * as apiKeyService from './apiKey.service';
import { IApiKeyCreateResponse, IApiKeyResponse } from './apiKey.interfaces';

/**
 * Format API key for response (without sensitive data)
 */
const formatApiKeyResponse = (apiKey: any): IApiKeyResponse => ({
    id: apiKey._id.toString(),
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    permission: apiKey.permission,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    isActive: apiKey.isActive,
    allowedIPs: apiKey.allowedIPs,
    rateLimit: apiKey.rateLimit,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
});

/**
 * Create a new API key
 * POST /api-keys
 */
export const createApiKey = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.user?.company?._id;
    const userId = req.user?._id;

    if (!companyId || !userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    const { apiKey, plainKey } = await apiKeyService.createApiKey(
        req.body,
        companyId.toString(),
        userId.toString()
    );

    const response: IApiKeyCreateResponse = {
        ...formatApiKeyResponse(apiKey),
        key: plainKey, // Only returned on creation!
    };

    res.status(httpStatus.CREATED).send({
        success: true,
        message: 'API key created. Save the key now - it will not be shown again.',
        data: response,
    });
});

/**
 * Get all API keys for company
 * GET /api-keys
 */
export const getApiKeys = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.user?.company?._id;

    if (!companyId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await apiKeyService.queryApiKeys(companyId.toString(), options);

    // Format results
    const formattedResults = result.results.map(formatApiKeyResponse);

    res.send({
        success: true,
        data: {
            results: formattedResults,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            totalResults: result.totalResults,
        },
    });
});

/**
 * Get a single API key
 * GET /api-keys/:id
 */
export const getApiKey = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.user?.company?._id;
    const { id } = req.params;

    if (!companyId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    const apiKey = await apiKeyService.getApiKeyById(id, companyId.toString());

    if (!apiKey) {
        throw new ApiError(httpStatus.NOT_FOUND, 'API key not found');
    }

    res.send({
        success: true,
        data: formatApiKeyResponse(apiKey),
    });
});

/**
 * Update an API key
 * PATCH /api-keys/:id
 */
export const updateApiKey = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.user?.company?._id;
    const { id } = req.params;

    if (!companyId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    const apiKey = await apiKeyService.updateApiKey(id, companyId.toString(), req.body);

    res.send({
        success: true,
        data: formatApiKeyResponse(apiKey),
    });
});

/**
 * Delete an API key
 * DELETE /api-keys/:id
 */
export const deleteApiKey = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.user?.company?._id;
    const { id } = req.params;

    if (!companyId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    await apiKeyService.deleteApiKey(id, companyId.toString());

    res.status(httpStatus.NO_CONTENT).send();
});
