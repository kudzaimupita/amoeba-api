import mongoose from 'mongoose';
import { ITransactionDoc, ITransactionModel } from './transaction.interfaces';
import paginate from '../../utils/paginate/paginate';
import toJSON from '../../utils/toJSON/toJSON';

const transactionSchema = new mongoose.Schema<ITransactionDoc, ITransactionModel>(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'ZAR',
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failed', 'abandoned', 'pending'],
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['topUp', 'new_subscription', 'old_subscription', 'change_plan', 'recurring_payment'],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paystackData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
transactionSchema.index({ company: 1, createdAt: -1 });
transactionSchema.index({ company: 1, status: 1, createdAt: -1 });
transactionSchema.index({ company: 1, action: 1, createdAt: -1 });

// Add plugin that converts mongoose to json
transactionSchema.plugin(toJSON);
transactionSchema.plugin(paginate);

const Transaction = mongoose.model<ITransactionDoc, ITransactionModel>('Transaction', transactionSchema);

export default Transaction;
