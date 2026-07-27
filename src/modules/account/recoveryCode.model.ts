import crypto from 'crypto';
import mongoose from 'mongoose';
import toJSON from '../../utils/toJSON/toJSON';
import { IRecoveryCodeDoc, IRecoveryCodeModel } from './recoveryCode.interfaces';

const recoveryCodeSchema = new mongoose.Schema<IRecoveryCodeDoc, IRecoveryCodeModel>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codeHash: { type: String, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recoveryCodeSchema.index({ user: 1, usedAt: 1 });

recoveryCodeSchema.plugin(toJSON);

const RecoveryCode = mongoose.model<IRecoveryCodeDoc, IRecoveryCodeModel>('RecoveryCode', recoveryCodeSchema);

export default RecoveryCode;
