import crypto from 'crypto';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import ApiKey from './apiKey.model';
import { ApiError } from '../../utils/errors';
import { IApiKeyDoc, ICreateApiKeyRequest, IUpdateApiKeyRequest } from './apiKey.interfaces';
import { IOptions, QueryResult } from '../../utils/paginate/paginate';

/**
 * Generate a random API key
 */
const generateApiKey = (): { key: string; keyPrefix: string; hashedKey: string } => {
    const prefix = 'sk_live_';
    const randomPart = crypto.randomBytes(24).toString('hex');
    const key = `${prefix}${randomPart}`;
    const hashedKey = hashApiKey(key);
    return { key, keyPrefix: prefix, hashedKey };
};

/**
 * Hash an API key for storage
 */
export const hashApiKey = (key: string): string => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Create a new API key
 */
export const createApiKey = async (
    body: ICreateApiKeyRequest,
    companyId: string,
    userId: string
): Promise<{ apiKey: IApiKeyDoc; plainKey: string }> => {
    const { key, keyPrefix, hashedKey } = generateApiKey();

    const apiKey = await ApiKey.create({
        ...body,
        key: hashedKey,
        keyPrefix,
        company: new Types.ObjectId(companyId),
        createdBy: new Types.ObjectId(userId),
    });

    return { apiKey, plainKey: key };
};

/**
 * Query API keys for a company
 */
export const queryApiKeys = async (
    companyId: string,
    options: IOptions
): Promise<QueryResult> => {
    const filter = { company: new Types.ObjectId(companyId) };
    return ApiKey.paginate(filter, options);
};

/**
 * Get API key by ID
 */
export const getApiKeyById = async (
    id: string,
    companyId: string
): Promise<IApiKeyDoc | null> => {
    return ApiKey.findOne({
        _id: new Types.ObjectId(id),
        company: new Types.ObjectId(companyId),
    });
};

/**
 * Validate an API key and return the key document
 */
export const validateApiKey = async (plainKey: string): Promise<IApiKeyDoc | null> => {
    const hashedKey = hashApiKey(plainKey);

    const apiKey = await ApiKey.findOne({ key: hashedKey })
        .select('+key')
        .populate('company');

    if (!apiKey) {
        return null;
    }

    // Check if active
    if (!apiKey.isActive) {
        return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
    }

    return apiKey;
};

/**
 * Update last used timestamp
 */
export const updateLastUsed = async (id: Types.ObjectId): Promise<void> => {
    await ApiKey.updateOne({ _id: id }, { lastUsedAt: new Date() });
};

/**
 * Update API key
 */
export const updateApiKey = async (
    id: string,
    companyId: string,
    updates: IUpdateApiKeyRequest
): Promise<IApiKeyDoc | null> => {
    const apiKey = await getApiKeyById(id, companyId);

    if (!apiKey) {
        throw new ApiError(httpStatus.NOT_FOUND, 'API key not found');
    }

    Object.assign(apiKey, updates);
    await apiKey.save();
    return apiKey;
};

/**
 * Delete API key
 */
export const deleteApiKey = async (id: string, companyId: string): Promise<void> => {
    const apiKey = await getApiKeyById(id, companyId);

    if (!apiKey) {
        throw new ApiError(httpStatus.NOT_FOUND, 'API key not found');
    }

    await apiKey.deleteOne();
};

/**
 * Check if IP is allowed for API key
 */
export const isIpAllowed = (apiKey: IApiKeyDoc, ip: string): boolean => {
    if (!apiKey.allowedIPs || apiKey.allowedIPs.length === 0) {
        return true; // No IP restriction
    }
    return apiKey.allowedIPs.includes(ip);
};

/**
 * Check if operation is allowed for API key permission level
 */
export const isOperationAllowed = (
    permission: string,
    operationType: string
): boolean => {
    if (permission === 'admin') {
        return true;
    }

    // Readonly can only read
    const readOperations = ['read', 'readList'];
    return readOperations.includes(operationType);
};
