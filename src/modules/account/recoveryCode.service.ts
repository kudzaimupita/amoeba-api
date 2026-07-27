import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import ApiError from '../../utils/errors/ApiError';
import RecoveryCode from './recoveryCode.model';
import { RecoveryCodeSummary } from './recoveryCode.interfaces';

export const RECOVERY_CODE_COUNT = 10;

const normalizeRecoveryCode = (code: string): string => code.replace(/[\s-]/g, '').toUpperCase();

const hashRecoveryCode = (code: string): string =>
  crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');

const generatePlainRecoveryCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';

  for (let i = 0; i < 8; i += 1) {
    raw += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
};

export const getRecoveryCodeSummary = async (userId: mongoose.Types.ObjectId | string): Promise<RecoveryCodeSummary> => {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const [total, remaining, latest] = await Promise.all([
    RecoveryCode.countDocuments({ user: userObjectId }),
    RecoveryCode.countDocuments({ user: userObjectId, usedAt: null }),
    RecoveryCode.findOne({ user: userObjectId }).sort({ createdAt: -1 }).select('createdAt'),
  ]);

  return {
    total,
    remaining,
    lastGeneratedAt: latest?.createdAt,
  };
};

export const generateRecoveryCodes = async (userId: mongoose.Types.ObjectId | string): Promise<string[]> => {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  await RecoveryCode.deleteMany({ user: userObjectId });

  const plainCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generatePlainRecoveryCode());
  await RecoveryCode.insertMany(
    plainCodes.map((code) => ({
      user: userObjectId,
      codeHash: hashRecoveryCode(code),
      usedAt: null,
    }))
  );

  return plainCodes;
};

export const verifyAndConsumeRecoveryCode = async (
  userId: mongoose.Types.ObjectId | string,
  plainCode: string
): Promise<void> => {
  const normalized = normalizeRecoveryCode(plainCode);
  if (normalized.length < 8) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid recovery code', true, '', 'AUTH_RECOVERY_CODE_INVALID');
  }

  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const codeHash = hashRecoveryCode(plainCode);

  const codeDoc = await RecoveryCode.findOne({ user: userObjectId, codeHash, usedAt: null });
  if (!codeDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid recovery code', true, '', 'AUTH_RECOVERY_CODE_INVALID');
  }

  codeDoc.usedAt = new Date();
  await codeDoc.save();
};

export const revokeAllRecoveryCodes = async (userId: mongoose.Types.ObjectId | string): Promise<number> => {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const result = await RecoveryCode.deleteMany({ user: userObjectId });
  return result.deletedCount ?? 0;
};

export { hashRecoveryCode, normalizeRecoveryCode };
