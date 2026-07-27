import { Document, Model, Types } from 'mongoose';

export type ApiKeyPermission = 'admin' | 'readonly';

export interface IApiKey {
    name: string;
    key: string;
    keyPrefix: string;
    company: Types.ObjectId;
    createdBy: Types.ObjectId;
    permission: ApiKeyPermission;
    lastUsedAt?: Date;
    expiresAt?: Date;
    isActive: boolean;
    rateLimit?: number;
    allowedIPs?: string[];
}

export interface IApiKeyDoc extends IApiKey, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IApiKeyModel extends Model<IApiKeyDoc> {
    paginate(filter: Record<string, any>, options: Record<string, any>): Promise<any>;
}

export interface ICreateApiKeyRequest {
    name: string;
    permission: ApiKeyPermission;
    expiresAt?: Date;
    allowedIPs?: string[];
    rateLimit?: number;
}

export interface IUpdateApiKeyRequest {
    name?: string;
    isActive?: boolean;
    allowedIPs?: string[];
    rateLimit?: number;
}

export interface IApiKeyResponse {
    id: string;
    name: string;
    keyPrefix: string;
    permission: ApiKeyPermission;
    lastUsedAt?: Date;
    expiresAt?: Date;
    isActive: boolean;
    allowedIPs?: string[];
    rateLimit?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IApiKeyCreateResponse extends IApiKeyResponse {
    key: string; // Full key only returned on creation
}
