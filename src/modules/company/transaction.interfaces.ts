import mongoose, { Document, Model } from 'mongoose';

export interface ITransaction {
  company: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  reference: string;
  amount: number; // Amount in base currency (not kobo/cents)
  currency: string;
  status: 'success' | 'failed' | 'abandoned' | 'pending';
  action: 'topUp' | 'new_subscription' | 'old_subscription' | 'change_plan' | 'recurring_payment';
  metadata?: {
    planId?: string;
    planName?: string;
    tokensAdded?: number;
    oldPlanId?: string;
    newPlanId?: string;
    [key: string]: any;
  };
  paystackData?: {
    transactionId?: number;
    customerCode?: string;
    customerEmail?: string;
    channel?: string;
    gatewayResponse?: string;
    paidAt?: Date;
    fees?: number;
    [key: string]: any;
  };
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactionDoc extends ITransaction, Document {}

export interface ITransactionModel extends Model<ITransactionDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<any>;
}
