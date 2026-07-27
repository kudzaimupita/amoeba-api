import { Document, Model, Types } from 'mongoose';

export interface IRecoveryCode {
  user: Types.ObjectId;
  codeHash: string;
  usedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecoveryCodeDoc extends IRecoveryCode, Document {}

export interface IRecoveryCodeModel extends Model<IRecoveryCodeDoc> {}

export type RecoveryCodeSummary = {
  total: number;
  remaining: number;
  lastGeneratedAt?: Date;
};
