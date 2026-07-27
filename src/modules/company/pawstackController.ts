/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-else-return */
/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
// paymentController.js - Enhanced version
// @ts-nocheck

import axios from 'axios';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Company, companyService, payService, transactionService } from '.';
import { User, userService } from '../user';
import {
  calculateDaysBetweenDates,
  cancelChange,
  cancelSubscription,
  checkExistingSubscriptions,
  createCustomer,
  createSubscription,
  getAllPlans,
  getCustomer,
  getPlan,
  getSubscriptionDetails,
  getTransactionHistory,
  initiateTransaction,
  prorateChange,
  verifyTransaction,
} from './payStackService';


// Helper function to get transaction reference for subscription

// @ts-nocheck

const handleSubscriptionCreate = async (event) => {
  try {
    const { subscription_code, customer, plan, amount, next_payment_date } = event.data;
    const customerCode = customer.customer_code;

    // Find the company by Paystack customer ID
    const company = await Company.findOne({ email: customer.email });

    if (!company) {
      console.error(`No company found with Paystack customer ID: ${customerCode}`);
      return {
        status: false,
        message: `No company found with Paystack customer ID: ${customerCode}`,
      };
    }

    // Calculate next billing date based on Paystack's next_payment_date
    const nextBillingDate = new Date(next_payment_date);

    // Update company billing information
    await Company.updateOne(
      { _id: company._id },
      {
        $set: {
          'billing.plan': plan.name,
          'billing.lastPaymentDate': new Date(),
          'billing.nextBillingDate': nextBillingDate,
          'billing.subscriptionActive': true,
          'billing.paymentStatus': 'paid',
          'billing.subscriptionReference': subscription_code,
          'billing.overdue': false,
          'billing.overdueNotificationCount': 0,
          'billing.lastInvoiceAmount': amount / 100, // Converting from cents/kobo to main currency
          'billing.accountDeactivated': false,
          'billing.subscriptionCreatedAt': new Date(),
        },
        $unset: {
          'billing.paymentFailures': 1,
          'billing.suspensionWarning': 1,
        },
      }
    );

    return {
      status: true,
      message: 'Successfully processed subscription.create event',
      companyId: company._id,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
      error,
    };
  }
};
export const topUp = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'amount is required' });
  }
  // const company = await companyService.getCompanyById(req.user.company);
  try {
    // Check if customer already exists
    let customer;
    try {
      customer = await getCustomer(req.user.email);
    } catch (error) {
      // If customer doesn't exist, create a new one
      customer = await createCustomer(req.user.email, req.user.name, '', '');
    }

    // Get plan details to determine the amount
    // const plan = await getPlan(planId);
    // const planAmount = plan.data.amount / 100; // Convert from kobo to base currency

    // Generate a unique reference for this transaction
    const reference = `sub_${uuidv4()}`;

    // Create payment link
    const paymentInitiation = await initiateTransaction(
      req.user.email,
      req.body.amount,
      reference,
      req.body.link,
      //   'https://32ea-197-245-211-244.ngrok-free.app/v1/companies/webhook/verify',
      { action: 'topUp', user: req.user?._id }
    );

    res.status(200).json({
      message: 'Subscription initiated',
      customer: customer.data,
      paymentLink: paymentInitiation.data.authorization_url,
      reference: paymentInitiation.data.reference,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error subscribing user', details: error.message });
  }
};
// const crypto = require('crypto');
// Subscribe a user to a plan
export const subscribeUser = async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'Plan ID are required' });
  }
  const company = await companyService.getCompanyById(req.user.company);
  try {
    // Check if customer already exists
    let customer;
    try {
      customer = await getCustomer(company.email);
    } catch (error) {
      // If customer doesn't exist, create a new one
      customer = await createCustomer(company.email, company.name, '', '');
    }

    // Get plan details to determine the amount
    const plan = await getPlan(planId);
    const planAmount = plan.data.amount / 100; // Convert from kobo to base currency

    // Generate a unique reference for this transaction
    const reference = `sub_${uuidv4()}`;

    // Create payment link
    const paymentInitiation = await initiateTransaction(
      company.email,
      planAmount,
      reference,
      `${process.env.UI_URI}`,
      //   'https://32ea-197-245-211-244.ngrok-free.app/v1/companies/webhook/verify',
      { planId, action: req.body.old ? 'old_subscription' : 'new_subscription', companyId: company?._id, plan }
    );

    res.status(200).json({
      message: 'Subscription initiated',
      customer: customer.data,
      paymentLink: paymentInitiation.data.authorization_url,
      reference: paymentInitiation.data.reference,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error subscribing user', details: error.message });
  }
};
export const getPlans = async (req, res) => {
  //   const { email, firstName, lastName, phone, planId } = req.body;

  //   if (!email || !planId) {
  //     return res.status(400).json({ error: 'Email and plan ID are required' });
  //   }

  try {
    // Create payment link
    const plans = await getAllPlans();

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Error subscribing user', details: error.message });
  }
};

export const getHistory = async (req, res) => {
  const company = await companyService.getCompanyById(req.user.company);

  try {
    // Get pagination options from query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = (req.query.sortBy as string) || 'createdAt:desc';

    // Build filter options
    const filter: any = { company: company._id };

    // Optional status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Optional action filter
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Query transactions from our database
    const transactions = await transactionService.queryTransactions(filter, {
      page,
      limit,
      sortBy,
    });

    // Calculate total volume for metadata
    const successfulTransactions = await transactionService.queryTransactions(
      { company: company._id, status: 'success' },
      { limit: 999999 }
    );

    const totalVolume = successfulTransactions.results.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );

    // Return in Paystack-compatible format for easier frontend integration
    res.status(200).json({
      status: true,
      message: 'Transactions retrieved',
      data: transactions.results,
      meta: {
        total: transactions.totalResults,
        total_volume: Math.round(totalVolume * 100), // Convert to kobo for consistency
        skipped: 0,
        perPage: limit,
        page,
        pageCount: transactions.totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving transaction history', details: error.message });
  }
};

export const cancelSub = async (req, res) => {
  const company = await companyService.getCompanyById(req.user.company);
  const customerEmail = company.email;
  const customer = await getCustomer(customerEmail);

  // Get current subscription details
  const subscriptionDetails = customer.data?.subscriptions?.[0];

  if (!subscriptionDetails) {
    return res.status(404).json({ error: 'No active subscription found' });
  }

  try {
    // Cancel the subscription first
    await cancelSubscription(subscriptionDetails.subscription_code, subscriptionDetails?.email_token);
    const transactions = await getTransactionHistory(subscriptionDetails?.email_token);
    // Try to get the transaction for this subscription
    const planId = transactions?.data[0].metadata.planId;
    // 
    // transactions?.data[0];
    const oldPlanData = await getPlan(planId);
    // Log planId
    // Log plan data
    // Log amounts
    const oldPlanAmount = oldPlanData.data.amount / 100;
    // Log dates
    const currentDate = new Date();
    // 

    // 
    const endDate = new Date(subscriptionDetails?.next_payment_date);
    // 
    // ));

    // Log days calculation
    const daysRemaining = calculateDaysBetweenDates(currentDate, endDate);
    // Log interval and rate
    // 
    const oldPlanDailyRate = oldPlanAmount / 30;
    // Log final calculation
    const oldPlanCredit = oldPlanDailyRate * daysRemaining;

    // Calculate the full new plan charge
    // const newPlanCharge = newPlanAmount;

    // Calculate the difference (what the user needs to pay or be credited)
    // const priceDifference = newPlanCharge - oldPlanCredit;

    // const refund = await cancelChange(subscriptionDetails?.plan?.plan_code, subscriptionDetails?.next_payment_date);
    // If transaction found, initiate a refund
    if (transactions?.data[0]?.reference) {
      try {
        const refundResult = await initiateRefund(transactions?.data[0]?.reference, oldPlanCredit * 100);
        return res.status(200).json({
          message: 'Subscription canceled and refund initiated',
          refundDetails: refundResult,
        });
      } catch (refundError) {
        // Still return 200 since the subscription was canceled
        return res.status(200).json({
          message: 'Subscription canceled but refund failed',
          error: refundError.message,
        });
      }
    }

    // If no transaction found
    res.status(200).json({
      message: 'Subscription canceled successfully',
      note: 'No transaction found for refund',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error canceling subscription', details: error.message });
  }
};
// import axios from 'axios';

export async function convertZarToClaudeTokens(amountInRands: number): Promise<number> {
  try {
    // Fetch the USD to ZAR exchange rate
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');

    if (!response.data || !response.data.rates || !response.data.rates.ZAR) {
      throw new Error('Failed to fetch exchange rate');
    }

    // Calculate the exchange rate
    const zarToUsd = 1 / response.data.rates.ZAR;

    // Convert ZAR to USD
    const usd = amountInRands * zarToUsd;
    // Token price per unit in USD (7x Claude 3.5 Haiku markup)
    const TOKEN_PRICE_PER_UNIT = 0.000005;

    // Calculate how many tokens the USD can buy
    const tokens = usd / TOKEN_PRICE_PER_UNIT;

    return Math.floor(tokens); // Round down to the nearest whole token
  } catch (error) {
    throw new Error('Currency conversion failed');
  }
}
// // Process webhook for payment verification
export const processPaymentWebhook = async (req, res) => {
  // Verify that the request is from Paystack
  try {
    if (!req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }
  } catch (error) {
    return res.status(500).send('Error verifying signature');
  }

  const event = req.body;

  // Handle successful charges
  if (event.event === 'charge.success') {
    const { reference, metadata, amount } = event.data;

    // Verify the transaction
    try {
      const verification = await verifyTransaction(reference);

      if (verification.data.status === 'success') {
        const { email } = verification.data.customer;

        try {
          if (metadata && metadata.action === 'topUp') {
            const tokens = await convertZarToClaudeTokens(verification.data.amount / 100);
            const user = await User.findById(new mongoose.Types.ObjectId(metadata.user));

            await User.updateOne(
              { _id: new mongoose.Types.ObjectId(metadata.user) },

              {
               $unset: {
          isTopUpNotified: 1,
          topUpNotificationDate: 1
        },
                $inc: { currentTokens: tokens || 0 }, // Increment the loginCount by 1
              }
            );

            // Store successful top-up transaction
            await transactionService.createTransaction({
              company: user?.company || metadata.companyId,
              user: new mongoose.Types.ObjectId(metadata.user),
              reference,
              amount: verification.data.amount / 100, // Convert from kobo to base currency
              currency: verification.data.currency,
              status: 'success',
              action: 'topUp',
              metadata: {
                tokensAdded: tokens,
                ...metadata,
              },
              paystackData: {
                transactionId: verification.data.id,
                customerCode: verification.data.customer.customer_code,
                customerEmail: verification.data.customer.email,
                channel: verification.data.channel,
                gatewayResponse: verification.data.gateway_response,
                paidAt: verification.data.paid_at,
                fees: verification.data.fees ? verification.data.fees / 100 : 0,
              },
              description: `Top-up of ${tokens} tokens`,
            });

            res.status(200).send();
            return;
          }
          // If this is for a new subscription
          if (metadata && metadata.action === 'new_subscription') {
            const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(metadata.companyId));

            let subscription;

            if (false) {
              // subscription = existingSubscription;
            } else {
              subscription = await createSubscription(company.email, metadata.planId);
            }

            // Update company billing plan and invoice dates
            if (metadata.companyId) {
              if (company) {
                // Determine plan name
                const planName = metadata.plan?.data?.name || metadata.planId;

                // Calculate next billing date (usually 30 days from now)
                const nextBillingDate = new Date();
                nextBillingDate.setDate(nextBillingDate.getDate() + 30);

                await Company.updateOne(
                  { _id: company._id },
                  {
                    $set: {
                      'billing.plan': planName,
                      'billing.lastPaymentDate': new Date(),
                      'billing.nextBillingDate': nextBillingDate,
                      'billing.subscriptionActive': true,
                      'billing.paymentStatus': 'paid',
                      'billing.paymentReference': reference,
                      'billing.subscriptionReference': subscription?.data?.subscription_code || null,
                      'billing.overdue': false,
                      'billing.overdueNotificationCount': 0,
                      'billing.lastInvoiceAmount': amount / 100, // Converting from kobo/cents
                      'billing.accountDeactivated': false,
                    },
                    $unset: {
                      'billing.paymentFailures': 1,
                    },
                  }
                );

                // Store successful subscription transaction
                await transactionService.createTransaction({
                  company: company._id,
                  reference,
                  amount: amount / 100, // Convert from kobo to base currency
                  currency: verification.data.currency,
                  status: 'success',
                  action: 'new_subscription',
                  metadata: {
                    planId: metadata.planId,
                    planName,
                    subscriptionCode: subscription?.data?.subscription_code,
                    ...metadata,
                  },
                  paystackData: {
                    transactionId: verification.data.id,
                    customerCode: verification.data.customer.customer_code,
                    customerEmail: verification.data.customer.email,
                    channel: verification.data.channel,
                    gatewayResponse: verification.data.gateway_response,
                    paidAt: verification.data.paid_at,
                    fees: verification.data.fees ? verification.data.fees / 100 : 0,
                  },
                  description: `Subscription to ${planName} plan`,
                });
              } else {
                throw new Error(`Company with ID ${metadata.companyId} not found`);
              }
            }
          } else if (metadata && metadata.action === 'old_subscription') {
            const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(metadata.companyId));

            if (metadata.companyId) {
              if (company) {
                const planName = metadata.plan?.data?.name || metadata.planId;

                const nextBillingDate = new Date();
                nextBillingDate.setDate(nextBillingDate.getDate() + 30);

                await Company.updateOne(
                  { _id: company._id },
                  {
                    $set: {
                      'billing.plan': planName,
                      'billing.lastPaymentDate': new Date(),
                      'billing.nextBillingDate': nextBillingDate,
                      'billing.subscriptionActive': true,
                      'billing.paymentStatus': 'paid',
                      'billing.paymentReference': reference,
                      // 'billing.subscriptionReference': subscription?.data?.subscription_code || null,
                      'billing.overdue': false,
                      'billing.overdueNotificationCount': 0,
                      'billing.lastInvoiceAmount': amount / 100, // Converting from kobo/cents
                      'billing.accountDeactivated': false,
                    },
                    $unset: {
                      'billing.paymentFailures': 1,
                    },
                  }
                );
              } else {
                throw new Error(`Company with ID ${metadata.companyId} not found`);
              }
            }
          }
          // If this is for a plan change
          else if (metadata && metadata.action === 'change_plan') {
            const newPlan = await getPlan(metadata.newPlanId);
            // Cancel old subscription first
            if (metadata.oldSubscriptionCode) {
              await cancelSubscription(metadata.oldSubscriptionCode, metadata.oldPlanCode);
            }

            const subscription = await createSubscription(email, metadata.newPlanId);

            // Update company billing plan
            if (metadata.companyId) {
              const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(metadata.companyId));
              if (company) {
                const nextBillingDate = new Date();
                nextBillingDate.setDate(nextBillingDate.getDate() + 30);

                const planName = newPlan?.name || metadata.newPlanName || metadata.newPlanId;

                await Company.updateOne(
                  { _id: company._id },
                  {
                    $set: {
                      'billing.plan': planName,
                      'billing.lastPaymentDate': new Date(),
                      'billing.nextBillingDate': nextBillingDate,
                      'billing.subscriptionActive': true,
                      'billing.paymentStatus': 'paid',
                      'billing.paymentReference': reference,
                      'billing.subscriptionReference': subscription?.data?.subscription_code || null,
                      'billing.overdue': false,
                      'billing.overdueNotificationCount': 0,
                      'billing.lastInvoiceAmount': amount / 100,
                      'billing.accountDeactivated': false,
                    },
                    $unset: {
                      'billing.paymentFailures': 1,
                    },
                  }
                );

                // Create invoice record
              }
            }
          }
          // If this is a recurring payment
          else if (metadata && metadata.action === 'recurring_payment') {

            if (metadata.companyId) {
              const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(metadata.companyId));
              if (company) {
                // Calculate next billing date
                const nextBillingDate = new Date();
                nextBillingDate.setDate(nextBillingDate.getDate() + 30);

                await Company.updateOne(
                  { _id: company._id },
                  {
                    $set: {
                      'billing.lastPaymentDate': new Date(),
                      'billing.nextBillingDate': nextBillingDate,
                      'billing.paymentStatus': 'paid',
                      'billing.paymentReference': reference,
                      'billing.overdue': false,
                      'billing.overdueNotificationCount': 0,
                      'billing.lastInvoiceAmount': amount / 100,
                      'billing.accountDeactivated': false,
                    },
                    $unset: {
                      'billing.paymentFailures': 1,
                    },
                  }
                );

                // Update invoice status
                // await Invoice.updateOne(
                //   { reference },
                //   {
                //     $set: {
                //       status: 'paid',
                //       paidAt: new Date(),
                //     },
                //   }
                // );
              }
            }
          }

        } catch (error) {

          // If we get here, the charge was successful but our processing failed,
          // so we should initiate a refund
          try {
            const refundResult = await initiateRefund(reference, amount);
            await logPaymentError({
              reference,
              email,
              error: error.message,
              refundInitiated: true,
              timestamp: new Date(),
            });

            return res.status(200).send('Webhook received, but processing failed. Refund initiated.');
          } catch (refundError) {
            await logPaymentError({
              reference,
              email,
              error: error.message,
              refundError: refundError.message,
              refundInitiated: false,
              timestamp: new Date(),
              urgent: true,
            });
          }
        }
      } else {
      }
    } catch (error) {
      return res.status(500).send('Error verifying transaction');
    }
  }
  // Handle failed charges
  else if (event.event === 'charge.failed') {
    const { reference, metadata, amount } = event.data;

    try {
      if (metadata && metadata.companyId) {
        const company = await companyService.getCompanyById(new mongoose.Types.ObjectId(metadata.companyId));
        if (company) {
          // Increment payment failures count
          const currentFailures = company.billing?.paymentFailures || 0;

          await Company.updateOne(
            { _id: company._id },
            {
              $set: {
                'billing.paymentStatus': 'failed',
                'billing.lastFailedPaymentDate': new Date(),
                'billing.paymentFailures': currentFailures + 1,
                'billing.accountDeactivated': false,
              },
              $inc: {
                'billing.overdueNotificationCount': 1,
              },
            }
          );

          // If this is the first failure, set an overdue flag
          if (currentFailures === 0) {
            await Company.updateOne(
              { _id: company._id },
              {
                $set: {
                  'billing.overdue': true,
                  'billing.firstOverdueDate': new Date(),
                },
              }
            );
          }

          // After 3 failures, potentially take action like suspending account
          if (currentFailures + 1 >= 3) {
            await Company.updateOne(
              { _id: company._id },
              {
                $set: {
                  'billing.suspensionWarning': true,
                },
              }
            );

            // Send suspension warning email
            await sendSuspensionWarningEmail(company.email);
          }
        }
      }
    } catch (error) {
    }
  }
  // Handle subscription events
  else if (event.event === 'subscription.disable') {
    const { customer, plan } = event.data;

    try {
      const company = await Company.findOne({ 'billing.paystackCustomerId': customer.customer_code });
      if (company) {
        await Company.updateOne(
          { _id: company._id },
          {
            $set: {
              'billing.subscriptionActive': false,
              'billing.subscriptionEndDate': new Date(),
            },
          }
        );
      }
    } catch (error) {
    }
  } else if (event.event === 'subscription.create') {
      await handleSubscriptionCreate(event);
    } else if (event.event === 'subscription.not_renew') {
      const { subscription_code, customer, plan, amount, next_payment_date } = event.data;
      const customerCode = customer.customer_code;
      // Find the company by Paystack customer ID
      const company = await Company.findOne({ email: customer.email });

      if (!company) {
        console.error(`No company found with Paystack customer ID: ${customerCode}`);
        return {
          status: false,
          message: `No company found with Paystack customer ID: ${customerCode}`,
        };
      }

      await Company.updateOne(
        { _id: company._id },
        {
          $set: {
            'billing.plan': 'free',
            'billing.lastPaymentDate': new Date(),
            'billing.nextBillingDate': '',
            'billing.paymentStatus': 'paid',
            'billing.paymentReference': '',
            'billing.overdue': false,
            'billing.overdueNotificationCount': 0,
            'billing.lastInvoiceAmount': '',
            'billing.accountDeactivated': false,
          },
          $unset: {
            'billing.paymentFailures': 1,
          },
        }
      );
    }

  res.status(200).send('Webhook received');
};

// Helper function to initiate a refund
const initiateRefund = async (reference, amount) => {
  try {
    const instance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const response = await instance.post('/refund', {
      transaction: reference,
      amount, // Amount in kobo/cents
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to log payment errors
const logPaymentError = async (errorData) => {
  try {
    // You could save this to your database
    // await PaymentError.create(errorData);

    // Send an alert if urgent
    if (errorData.urgent) {
      // await sendUrgentAlert(errorData);
    }

  } catch (logError) {
  }
};

// Helper function to send suspension warning
const sendSuspensionWarningEmail = async (email) => {
  try {
    // Implement your email sending logic here
  } catch (error) {
  }
};

// Helper function to initiate a refund

// Helper function to log payment errors

// Generate invoice for a customer
// const generateInvoice = async (req, res) => {
//   const { customerEmail } = req.params;

//   if (!customerEmail) {
//     return res.status(400).json({ error: 'Customer email is required' });
//   }

//   try {
//     const invoiceData = await generateInvoiceData(customerEmail);

//     res.status(200).json({
//       message: 'Invoice generated successfully',
//       invoice: invoiceData,
//     });
//   } catch (error) {
//     console.error('Invoice generation error:', error);
//     res.status(500).json({ error: 'Error generating invoice', details: error.message });
//   }
// };

// // Change subscription plan with proration
// // Updated paymentController.js function with refund implementation
export const changePlanAndCalculatePriceDifference = async (req, res) => {
  const company = await companyService.getCompanyById(req.user.company);
  const customerEmail = company.email;
  const { oldPlanId, newPlanId } = req.body;

  if (!customerEmail || !oldPlanId || !newPlanId) {
    return res.status(400).json({ error: 'Customer email, old plan ID, and new plan ID are required' });
  }

  try {
    const customer = await getCustomer(customerEmail);
    // Add logging to debug the request

    // Get current subscription details
    const subscriptionDetails = customer.data?.subscriptions?.[0];

    if (!subscriptionDetails) {
      return res.status(404).json({ error: 'No active subscription found for this customer' });
    }

    // Find active subscription
    const activeSubscription = subscriptionDetails;

    if (!activeSubscription) {
      return res.status(404).json({ error: 'No active subscription found for this customer' });
    }

    // Get the transaction used for this subscription
    // const transactionHistory = await getTransactionHistory(customerEmail);
    // // Find the latest transaction for this subscription
    // const subscriptionTransaction = transactionHistory.data.find(
    //   (tx) => tx.metadata && tx.metadata.subscription_code === activeSubscription.subscription_code
    // );

    // Calculate prorated charges
    const proration = await prorateChange(oldPlanId, newPlanId, activeSubscription.next_payment_date);
    const plan = await getPlan(newPlanId);
    // If price difference is positive, customer pays more
    if (proration.priceDifference > 0) {
      // Generate a unique reference for this transaction
      const reference = `change_${uuidv4()}`;

      // Create payment link for the difference
      const paymentInitiation = await initiateTransaction(
        customerEmail,
        proration.priceDifference,
        reference,
        `${process.env.UI_URI}`,
        {
          oldPlanId,
          newPlanId,
          action: 'change_plan',
          oldSubscriptionCode: activeSubscription.subscription_code,
          oldPlanCode: activeSubscription.email_token,
          plan,
          planId: newPlanId,
        }
      );

      return res.status(200).json({
        message: 'Plan change initiated - additional payment required',
        proration,
        paymentLink: paymentInitiation.data.authorization_url,
        reference: paymentInitiation.data.reference,
      });
    }
    // If price difference is negative, process refund before changing plan
    else if (proration.priceDifference < 0) {
      const refundAmount = Math.abs(proration.priceDifference);

      // Cancel the old subscription first
      await cancelSubscription(activeSubscription.subscription_code, activeSubscription.email_token);

      // Create a new subscription with the new plan
      const newSubscription = await createSubscription(customerEmail, newPlanId);
      const subscriptionDetails2 = customer.data?.subscriptions?.[0];

      if (!subscriptionDetails) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Cancel the subscription first
      // await cancelSubscription(subscriptionDetails.subscription_code, subscriptionDetails?.email_token);
      const transactions = await getTransactionHistory(subscriptionDetails2?.email_token);
      // Try to get the transaction for this subscription
      // const planId = transactions?.data[0].metadata.planId;
      // 
      // transactions?.data[0];
      // const oldPlanData = await getPlan(planId);
      // Process refund if we have a transaction reference
      let refundResult = null;
      if (transactions?.data[0] && transactions?.data[0]?.reference) {
        // Initiate the refund
        try {
          refundResult = await initiateRefund(transactions?.data[0]?.reference, refundAmount * 100);
        } catch (refundError) {
          // Continue with plan change even if refund fails, but log the error
        }
      }

      return res.status(200).json({
        message: 'Subscription plan downgraded successfully with refund',
        proration,
        refundAmount,
        refundStatus: refundResult ? 'processed' : 'not processed',
        refundDetails: refundResult ? refundResult.data : null,
        subscription: newSubscription.data,
      });
    }
    // If price difference is exactly zero, just change plan
    else {
      // Cancel the old subscription
      await cancelSubscription(activeSubscription.subscription_code, activeSubscription.email_token);

      // Create a new subscription with the new plan
      const newSubscription = await createSubscription(customerEmail, newPlanId);

      return res.status(200).json({
        message: 'Subscription plan updated successfully - no price difference',
        subscription: newSubscription.data,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error changing plan', details: error.message });
  }
};

// // Add this function to paystackService.js
// const initiateRefund = async (transactionReference, amount) => {
//   try {
//     const response = await paystackAxios.post('/refund', {
//       transaction: transactionReference,
//       amount: Math.round(amount * 100), // Convert to kobo/cents
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error initiating refund:', error.response?.data || error.message);
//     throw error;
//   }
// };

// // Don't forget to export the function in paystackService.js
// module.exports = {
//   // ...existing exports
//   initiateRefund,
// };

// // Cancel subscription
// const cancelUserSubscription = async (req, res) => {
//   const { customerEmail } = req.body;

//   if (!customerEmail) {
//     return res.status(400).json({ error: 'Customer email is required' });
//   }

//   try {
//     // Get current subscription details
//     const subscriptionDetails = await getSubscriptionDetails(customerEmail);

//     if (!subscriptionDetails.data || subscriptionDetails.data.length === 0) {
//       return res.status(404).json({ error: 'No subscription found for this customer' });
//     }

//     // Find active subscription
//     const activeSubscription = subscriptionDetails.data.find((sub) => sub.status === 'active');

//     if (!activeSubscription) {
//       return res.status(404).json({ error: 'No active subscription found for this customer' });
//     }

//     // Cancel the subscription
//     const cancellation = await cancelSubscription(activeSubscription.subscription_code);

//     res.status(200).json({
//       message: 'Subscription cancelled successfully',
//       subscription: cancellation.data,
//     });
//   } catch (error) {
//     console.error('Subscription cancellation error:', error);
//     res.status(500).json({ error: 'Error cancelling subscription', details: error.message });
//   }
// };

// // Reactivate a cancelled subscription
// const reactivateSubscription = async (req, res) => {
//   const { customerEmail, subscriptionCode } = req.body;

//   if (!customerEmail || !subscriptionCode) {
//     return res.status(400).json({ error: 'Customer email and subscription code are required' });
//   }

//   try {
//     // Enable the subscription
//     const reactivation = await enableSubscription(subscriptionCode, customerEmail);

//     res.status(200).json({
//       message: 'Subscription reactivated successfully',
//       subscription: reactivation.data,
//     });
//   } catch (error) {
//     console.error('Subscription reactivation error:', error);
//     res.status(500).json({ error: 'Error reactivating subscription', details: error.message });
//   }
// };

// // Verify a payment transaction
// const verifyPayment = async (req, res) => {
//   const { reference } = req.params;

//   if (!reference) {
//     return res.status(400).json({ error: 'Transaction reference is required' });
//   }

//   try {
//     const verification = await verifyTransaction(reference);

//     if (verification.data.status === 'success') {
//       res.status(200).json({
//         message: 'Payment successful',
//         data: verification.data,
//       });
//     } else {
//       res.status(400).json({
//         message: 'Payment verification failed',
//         data: verification.data,
//       });
//     }
//   } catch (error) {
//     console.error('Payment verification error:', error);
//     res.status(500).json({ error: 'Error verifying payment', details: error.message });
//   }
// };

// module.exports = {
//   subscribeUser,
//   processPaymentWebhook,
//   generateInvoice,
//   changePlanAndCalculatePriceDifference,
//   cancelUserSubscription,
//   reactivateSubscription,
//   verifyPayment,
// };

// export { subscribeUser };
