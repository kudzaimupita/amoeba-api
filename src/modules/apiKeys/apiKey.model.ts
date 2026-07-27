import mongoose, { Schema } from 'mongoose';
import { IApiKeyDoc, IApiKeyModel } from './apiKey.interfaces';
import { toJSON } from '../../utils/toJSON';
import { paginate } from '../../utils/paginate';

const apiKeySchema = new Schema<IApiKeyDoc, IApiKeyModel>(
    {
        name: {
            type: String,
            required: [true, 'API key name is required'],
            trim: true,
            maxlength: 100,
        },
        key: {
            type: String,
            required: true,
            unique: true,
            select: false, // Don't return key by default
        },
        keyPrefix: {
            type: String,
            required: true,
            maxlength: 12,
        },
        company: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: [true, 'Company is required'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
        },
        permission: {
            type: String,
            enum: ['admin', 'readonly'],
            default: 'readonly',
            required: true,
        },
        lastUsedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        rateLimit: {
            type: Number,
            min: 1,
            max: 10000,
        },
        allowedIPs: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Plugins
apiKeySchema.plugin(toJSON);
apiKeySchema.plugin(paginate as any);

// Indexes
apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ company: 1 });
apiKeySchema.index({ keyPrefix: 1 });
apiKeySchema.index({ isActive: 1, expiresAt: 1 });
apiKeySchema.index({ createdBy: 1 });

const ApiKey = mongoose.model<IApiKeyDoc, IApiKeyModel>('ApiKey', apiKeySchema);

export default ApiKey;
