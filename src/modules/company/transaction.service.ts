import mongoose from 'mongoose';
import Transaction from './transaction.model';
import { ITransaction, ITransactionDoc } from './transaction.interfaces';
import { IOptions } from '../../utils/paginate/paginate';

/**
 * Create a transaction
 * @param {ITransaction} transactionBody
 * @returns {Promise<ITransactionDoc>}
 */
export const createTransaction = async (transactionBody: ITransaction): Promise<ITransactionDoc> => {
  return Transaction.create(transactionBody);
};

/**
 * Query for transactions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<any>}
 */
export const queryTransactions = async (filter: Record<string, any>, options: IOptions): Promise<any> => {
  const transactions = await Transaction.paginate(filter, options);
  return transactions;
};

/**
 * Get transaction by reference
 * @param {string} reference
 * @returns {Promise<ITransactionDoc | null>}
 */
export const getTransactionByReference = async (reference: string): Promise<ITransactionDoc | null> => {
  return Transaction.findOne({ reference });
};

/**
 * Get transaction by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ITransactionDoc | null>}
 */
export const getTransactionById = async (id: mongoose.Types.ObjectId): Promise<ITransactionDoc | null> => {
  return Transaction.findById(id);
};

/**
 * Update transaction by reference
 * @param {string} reference
 * @param {Partial<ITransaction>} updateBody
 * @returns {Promise<ITransactionDoc | null>}
 */
export const updateTransactionByReference = async (
  reference: string,
  updateBody: Partial<ITransaction>
): Promise<ITransactionDoc | null> => {
  return Transaction.findOneAndUpdate({ reference }, updateBody, { new: true });
};

/**
 * Get transaction statistics for a company
 * @param {mongoose.Types.ObjectId} companyId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<any>}
 */
export const getTransactionStats = async (
  companyId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  const matchStage: any = {
    company: companyId,
    status: 'success',
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const stats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  return stats;
};
