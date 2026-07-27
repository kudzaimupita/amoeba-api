/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
// paystackService.js - Enhanced version
// @ts-nocheck
import { logger } from '../../utils/logger';

// @ts-nocheck
import axios from 'axios';
import 'dotenv/config';

const { PAYSTACK_SECRET_KEY } = process.env;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackAxios = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Customer management
export const createCustomer = async (email, firstName, lastName, phone) => {
  try {
    const response = await paystackAxios.post('/customer', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    return response.data;
  } catch (error) {
    logger.error('Error creating customer:', error.response?.data || error.message);
    throw error;
  }
};

export const getCustomer = async (customerEmail) => {
  try {
    const response = await paystackAxios.get(`/customer/${customerEmail}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching customer:', error.response?.data || error.message);
    throw error;
  }
};

const updateCustomer = async (customerId, updates) => {
  try {
    const response = await paystackAxios.put(`/customer/${customerId}`, updates);
    return response.data;
  } catch (error) {
    logger.error('Error updating customer:', error.response?.data || error.message);
    throw error;
  }
};

// Subscription management
// Subscription management
export const getSubscriptionDetails = async (customerEmail) => {
  try {
    // Make sure the email is properly encoded for URL
    const encodedEmail = encodeURIComponent(customerEmail);
    const customer = await getCustomer(customerEmail);
    // Add logging to debug the request
    // 

    const response = await paystackAxios.get(`/subscription?customer=${encodedEmail}`);

    // Add logging to see what's being returned
    // 

    // Check if response data exists and has the expected structure
    if (!response.data || !response.data.data) {
      return { status: response.data.status, message: response.data.message, data: [] };
    }

    // Ensure we're returning the actual data
    return response.data;
  } catch (error) {
    logger.error('Error fetching subscription details:', error.response?.data || error.message);
    // Return a structured error response instead of throwing
    return {
      status: false,
      message: error.response?.data?.message || error.message,
      data: [],
    };
  }
};

export const getSubscriptionById = async (subscriptionId) => {
  try {
    const response = await paystackAxios.get(`/subscription/${subscriptionId}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching subscription by ID:', error.response?.data || error.message);
    throw error;
  }
};
export const checkExistingSubscriptions = async (customerEmail) => {
  try {
    const response = await paystackAxios.get(`/subscription?customer=${customerEmail}`);
    const subscriptions = response.data.data || [];

    // Return the first subscription if any exist, otherwise null
    return subscriptions.length > 0 ? subscriptions[0] : null;
  } catch (error) {
    logger.error('Error checking existing subscriptions:', error.response?.data || error.message);
    return null; // Return null if there's an error
  }
};

export const createSubscription = async (customerEmail, planId, startDate = null) => {
  try {
    const payload = {
      customer: customerEmail,
      plan: planId,
    };

    if (startDate) {
      payload.start_date = startDate;
    }

    const response = await paystackAxios.post('/subscription', payload);
    return response.data;
  } catch (error) {
    logger.error('Error creating subscription:', error.response?.data || error.message);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionCode, token) => {
  try {
    const response = await paystackAxios.post(`/subscription/disable`, {
      code: subscriptionCode,
      token,
    });
    return response.data;
  } catch (error) {
    logger.error('Error canceling subscription:', error.response?.data || error.message);
    throw error;
  }
};
/**
 * Attempts to directly delete a subscription using the Admin API
 * Note: This may require admin-level API permissions
 *
 * @param {string} subscriptionId - The ID or code of the subscription to delete
 * @returns {Object} Response data with status and message
 */
export const deleteSubscription = async (subscriptionId) => {
  try {
    logger.info(`Attempting to delete subscription: ${subscriptionId}`);

    // Try using the DELETE HTTP method with the subscription endpoint
    const response = await paystackAxios.delete(`/subscription/${subscriptionId}`);

    logger.info('Deletion response:', response.data);
    return response.data;
  } catch (error) {
    // If DELETE doesn't work, try alternative approach with different endpoint
    try {
      logger.info('Direct deletion failed, trying alternative method');

      // Some payment processors use a "cancel" endpoint instead
      const cancelResponse = await paystackAxios.post(`/subscription/${subscriptionId}/cancel`, {});

      logger.info('Alternative deletion response:', cancelResponse.data);
      return cancelResponse.data;
    } catch (altError) {
      logger.error('Error deleting subscription:', altError.response?.data || altError.message);
      return {
        status: false,
        message: 'Subscription deletion failed with both methods. Paystack may require token-based cancellation.',
        error: altError.response?.data || altError.message,
      };
    }
  }
};
export const enableSubscription = async (subscriptionCode, email) => {
  try {
    const response = await paystackAxios.post(`/subscription/enable`, {
      code: subscriptionCode,
      token: subscriptionCode,
      email,
    });
    return response.data;
  } catch (error) {
    logger.error('Error enabling subscription:', error.response?.data || error.message);
    throw error;
  }
};

// Transaction management
export const getTransactionHistory = async (customerEmail) => {
  try {
    logger.info(customerEmail);

    // Fetch all transactions
    const response = await paystackAxios.get('/transaction');

    // Filter transactions by customer email
    const filteredTransactions = response.data.data.filter(
      (transaction) => transaction.customer && transaction.customer.email === customerEmail
    );

    // Return in the same structure as the original API response
    return {
      status: response.data.status,
      message: response.data.message,
      data: filteredTransactions,
      meta: response.data.meta,
    };
  } catch (error) {
    logger.error('Error fetching transaction history:', error.response?.data || error.message);
    throw error;
  }
};

export const initiateTransaction = async (email, amount, reference, callbackUrl, metadata = {}) => {
  try {
    const response = await paystackAxios.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
      reference,
      callback_url: callbackUrl,
      metadata,
    });
    return response.data;
  } catch (error) {
    logger.error('Error initiating transaction:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyTransaction = async (reference) => {
  try {
    const response = await paystackAxios.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    logger.error('Error verifying transaction:', error.response?.data || error.message);
    throw error;
  }
};

// Plan management
export const getAllPlans = async () => {
  try {
    const response = await paystackAxios.get('/plan');

    // Map through the response data and remove the subscriptions property from each plan
    const plansWithoutSubscriptions = response.data.data
      ?.filter((it) => !it.is_deleted)
      ?.filter((it) => !it.is_archived)
      .map((plan) => {
        const { subscriptions, ...planWithoutSubscriptions } = plan; // destructure to exclude 'subscriptions'
        return planWithoutSubscriptions;
      });
    return plansWithoutSubscriptions;
  } catch (error) {
    logger.error('Error fetching plans:', error.response?.data || error.message);
    throw error;
  }
};

export const getPlan = async (planId) => {
  try {
    const response = await paystackAxios.get(`/plan/${planId}`);
    return response.data;
  } catch (error) {
    logger.error('Error getting plan:', error.response?.data || error.message);
    throw error;
  }
};

const createPlan = async (name, amount, interval, description = '') => {
  try {
    const response = await paystackAxios.post('/plan', {
      name,
      amount: Math.round(amount * 100), // Convert to kobo
      interval, // 'hourly', 'daily', 'weekly', 'monthly', 'annually'
      description,
    });
    return response.data;
  } catch (error) {
    logger.error('Error creating plan:', error.response?.data || error.message);
    throw error;
  }
};

// Proration and billing calculations
export const calculateDaysBetweenDates = (startDate, endDate) => {
  const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const prorateChange = async (oldPlanId, newPlanId, subscriptionEndDate) => {
  try {
    // Get plan details
    const oldPlanData = await getPlan(oldPlanId);
    const newPlanData = await getPlan(newPlanId);

    const oldPlanAmount = oldPlanData.data.amount / 100; // Convert from kobo to base currency
    const newPlanAmount = newPlanData.data.amount / 100;

    const currentDate = new Date();
    const endDate = new Date(subscriptionEndDate);

    // Calculate the number of days remaining in the old plan cycle
    const daysRemaining = calculateDaysBetweenDates(currentDate, endDate);

    // Get interval days for calculation (monthly=30, yearly=365, etc.)
    const intervalDays = getIntervalDays(oldPlanData.data.interval);

    // Calculate the daily cost for the old plan and new plan
    const oldPlanDailyRate = oldPlanAmount / intervalDays;
    const newPlanDailyRate = newPlanAmount / intervalDays;

    // Prorate the old plan credit for the remaining days
    const oldPlanCredit = oldPlanDailyRate * daysRemaining;

    // Calculate the full new plan charge
    const newPlanCharge = newPlanAmount;

    // Calculate the difference (what the user needs to pay or be credited)
    const priceDifference = newPlanCharge - oldPlanCredit;

    return {
      oldPlanCredit,
      newPlanCharge,
      priceDifference,
      daysRemaining,
      oldPlanAmount,
      newPlanAmount,
    };
  } catch (error) {
    logger.error('Error calculating proration:', error);
    throw error;
  }
};
export const cancelChange = async (oldPlanId, subscriptionEndDate) => {
  try {
    // Get plan details
    const oldPlanData = await getPlan(oldPlanId);

    const oldPlanAmount = oldPlanData.data.amount / 100; // Convert from kobo to base currency
    const newPlanAmount = 0;

    const currentDate = new Date();
    const endDate = new Date(subscriptionEndDate);

    // Calculate the number of days remaining in the old plan cycle
    const daysRemaining = calculateDaysBetweenDates(currentDate, endDate);

    // Get interval days for calculation (monthly=30, yearly=365, etc.)
    const intervalDays = 30;

    // Calculate the daily cost for the old plan and new plan
    const oldPlanDailyRate = oldPlanAmount / intervalDays;

    // Prorate the old plan credit for the remaining days
    const oldPlanCredit = oldPlanDailyRate * daysRemaining;

    // Calculate the full new plan charge
    const newPlanCharge = newPlanAmount;

    // Calculate the difference (what the user needs to pay or be credited)
    const priceDifference = newPlanCharge - oldPlanCredit;

    return {
      oldPlanCredit,
      newPlanCharge,
      priceDifference,
      daysRemaining,
      oldPlanAmount,
      newPlanAmount,
    };
  } catch (error) {
    logger.error('Error calculating proration:', error);
    throw error;
  }
};

// Helper function to determine interval days
const getIntervalDays = (interval) => {
  switch (interval) {
    case 'hourly':
      return 1 / 24; // fraction of a day
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30; // simplified
    case 'quarterly':
      return 90;
    case 'biannually':
      return 182;
    case 'annually':
      return 365;
    default:
      return 30; // default to monthly
  }
};

// Invoice generation
const generateInvoiceData = async (customerEmail) => {
  try {
    const customerData = await getCustomer(customerEmail);
    const subscriptionData = await getSubscriptionDetails(customerEmail);
    const transactionData = await getTransactionHistory(customerEmail);

    let activeSubscription = null;
    if (subscriptionData.data && subscriptionData.data.length > 0) {
      // Find active subscription
      activeSubscription = subscriptionData.data.find((sub) => sub.status === 'active');
    }

    return {
      customer: customerData.data,
      subscription: activeSubscription,
      transactions: transactionData.data,
      generatedAt: new Date(),
      totalAmount: transactionData.data.reduce((sum, tx) => sum + tx.amount / 100, 0),
    };
  } catch (error) {
    logger.error('Error generating invoice data:', error);
    throw error;
  }
};
/**
 * Cancel a subscription with a prorated refund for unused days
 * @param {string} subscriptionCode - The Paystack subscription code to cancel
 * @param {string} customerEmail - The customer's email address
 * @returns {Promise<Object>} - The result of the cancellation and refund process
 */
export const cancelSubscriptionWithRefund = async (subscriptionCode, customerEmail) => {
  try {
    // Step 1: Get subscription details to calculate refund amount
    const subscriptionData = await getSubscriptionById(subscriptionCode);

    if (!subscriptionData.data || subscriptionData.data.status !== 'active') {
      throw new Error('No active subscription found with the provided code');
    }

    // Step 2: Calculate prorated refund
    const subscription = subscriptionData.data;
    const currentDate = new Date();
    const nextPaymentDate = new Date(subscription.next_payment_date);

    // Get plan details to determine the amount paid
    const planData = await getPlan(subscription.plan.id);
    const planAmount = planData.data.amount / 100; // Convert from kobo to base currency

    // Calculate days remaining and prorated refund
    const daysRemaining = calculateDaysBetweenDates(currentDate, nextPaymentDate);
    const intervalDays = getIntervalDays(subscription.plan.interval);
    const dailyRate = planAmount / intervalDays;
    const refundAmount = dailyRate * daysRemaining;

    // Step 3: Cancel the subscription
    const cancellationResult = await cancelSubscription(subscriptionCode);

    // Step 4: Process refund via Paystack
    // Find the last successful payment for this subscription
    const transactionHistory = await getTransactionHistory(customerEmail);
    const lastPayment = transactionHistory.data.find(
      (tx) => tx.status === 'success' && tx.metadata && tx.metadata.subscription_code === subscriptionCode
    );

    let refundResult = null;
    if (lastPayment && refundAmount > 0) {
      // Process refund - Note: Paystack doesn't have a direct refund API in the provided service
      // We'll implement a custom refund function below
      refundResult = await processRefund(
        lastPayment.reference,
        refundAmount,
        `Prorated refund for subscription ${subscriptionCode}`
      );
    }

    // Step 5: Update user account status (to be implemented based on your system)
    await updateUserAccountStatus(customerEmail, 'free');

    // Log the operation
    logger.info(
      `Subscription ${subscriptionCode} canceled with prorated refund of ${refundAmount} for user ${customerEmail}`
    );

    return {
      success: true,
      message: 'Subscription canceled successfully with prorated refund',
      subscription: cancellationResult.data,
      refundAmount,
      refundResult,
    };
  } catch (error) {
    logger.error('Error canceling subscription with refund:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Process a refund for a transaction
 * @param {string} transactionReference - The original transaction reference
 * @param {number} amount - The amount to refund
 * @param {string} reason - The reason for the refund
 * @returns {Promise<Object>} - The result of the refund process
 */
export const processRefund = async (transactionReference, amount, reason) => {
  try {
    // Paystack doesn't have a direct refund API in the provided service
    // We need to use their /refund endpoint
    const response = await paystackAxios.post('/refund', {
      transaction: transactionReference,
      amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
      merchant_note: reason,
    });

    return response.data;
  } catch (error) {
    logger.error('Error processing refund:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update a user's account status after subscription changes
 * @param {string} email - The user's email address
 * @param {string} status - The new account status ('free', 'premium', etc.)
 * @returns {Promise<Object>} - The result of the status update
 */
export const updateUserAccountStatus = async (email, status) => {
  try {
    // This implementation will depend on your user management system
    // This is a placeholder - replace with your actual implementation

    // Example implementation:
    // const user = await User.findOne({ email });
    // user.accountStatus = status;
    // user.subscriptionEndDate = status === 'free' ? new Date() : user.subscriptionEndDate;
    // await user.save();

    logger.info(`User account status updated to ${status} for ${email}`);

    return {
      success: true,
      message: `User account status updated to ${status}`,
    };
  } catch (error) {
    logger.error('Error updating user account status:', error);
    throw error;
  }
};
/**
 * Create a subscription after validating that the user doesn't already have an active subscription
 * @param {string} customerEmail - The customer's email address
 * @param {string} planId - The ID of the plan to subscribe to
 * @param {Date|null} startDate - Optional start date for the subscription
 * @returns {Promise<Object>} - The result of the subscription creation
 */
export const createSingleSubscription = async (customerEmail, planId, startDate = null) => {
  try {
    // Step 1: Check if the user already has an active subscription
    const subscriptionData = await getSubscriptionDetails(customerEmail);

    // Look for any active subscriptions
    const activeSubscription = subscriptionData.data?.find((sub) => sub.status === 'active');

    if (activeSubscription) {
      logger.warn(`User ${customerEmail} attempted to create a new subscription while having an active one`);
      throw new Error(
        'You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.'
      );
    }

    // Step 2: Create the new subscription since the user doesn't have an active one
    const subscriptionResult = await createSubscription(customerEmail, planId, startDate);

    // Step 3: Update the user's account status to reflect the new subscription
    await updateUserAccountStatus(customerEmail, 'premium');

    logger.info(`New subscription created for user ${customerEmail} with plan ${planId}`);

    return subscriptionResult;
  } catch (error) {
    logger.error('Error creating subscription:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update a user's subscription to a different plan
 * @param {string} customerEmail - The customer's email address
 * @param {string} newPlanId - The ID of the new plan
 * @returns {Promise<Object>} - The result of the subscription update
 */
export const updateSubscription = async (customerEmail, newPlanId) => {
  try {
    // Step 1: Get the current active subscription
    const subscriptionData = await getSubscriptionDetails(customerEmail);
    const activeSubscription = subscriptionData.data?.find((sub) => sub.status === 'active');

    if (!activeSubscription) {
      throw new Error('No active subscription found for the user');
    }

    // Step 2: Cancel the current subscription
    const cancellationResult = await cancelSubscriptionWithRefund(activeSubscription.subscription_code, customerEmail);

    // Step 3: Create a new subscription with the new plan
    const newSubscriptionResult = await createSubscription(customerEmail, newPlanId);

    // Step 4: Update user account status
    await updateUserAccountStatus(customerEmail, 'premium');

    logger.info(`Subscription updated for user ${customerEmail} from plan ${activeSubscription.plan.id} to ${newPlanId}`);

    return {
      success: true,
      message: 'Subscription updated successfully',
      oldSubscription: cancellationResult,
      newSubscription: newSubscriptionResult,
      refundAmount: cancellationResult.refundAmount,
    };
  } catch (error) {
    logger.error('Error updating subscription:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Check if a user has an active subscription
 * @param {string} customerEmail - The customer's email address
 * @returns {Promise<boolean>} - True if the user has an active subscription, false otherwise
 */
export const hasActiveSubscription = async (customerEmail) => {
  try {
    const subscriptionData = await getSubscriptionDetails(customerEmail);
    const activeSubscription = subscriptionData.data?.find((sub) => sub.status === 'active');

    return !!activeSubscription;
  } catch (error) {
    logger.error('Error checking active subscription:', error.response?.data || error.message);
    return false; // Default to false on error
  }
};
module.exports = {
  // Customer operations
  createCustomer,
  getCustomer,
  updateCustomer,

  // Subscription operations
  getSubscriptionDetails,
  getSubscriptionById,
  createSubscription,
  cancelSubscription,
  enableSubscription,

  // Transaction operations
  getTransactionHistory,
  initiateTransaction,
  verifyTransaction,

  // Plan operations
  getAllPlans,
  getPlan,
  createPlan,

  // Calculations and helpers
  calculateDaysBetweenDates,
  prorateChange,
  generateInvoiceData,
};
// export { getCustomer };
