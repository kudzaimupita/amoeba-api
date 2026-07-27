import mongoose, { Document, Model } from 'mongoose';

import { QueryResult } from '../../utils/paginate/paginate';
import { PlanType, BillingPlanLimits } from '../../config/billingPlans';

export interface ICompanyBilling {
  plan: PlanType;
  customLimits?: Partial<BillingPlanLimits>; // For enterprise custom plans
  monthlyUsage?: {
    deployments: number;
    invocations: number;
    lastReset: Date;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: string;
  billingInterval?: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  trialEndsAt?: Date;
  isTrialActive?: boolean;
  features?: string[]; // Additional features for the plan
  accountDeactivated?: boolean;
  paystackCustomerId?: string;
  paystackCustomerData?: any;
}

export interface ICompanyDoc extends Document {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  currency?: string;
  timeZone?: string;
  industry?: string;
  tokenExpire?: string;
  mainObjective?: string;
  multipleSites?: string;
  trialStartDate: Date;
  trialEndDate: Date;
  trialEnded: boolean;
  populateDemoData?: string;
  setDefaultData?: boolean;
  sessionTime?: string;
  imageCover?: string;
  logo?: string;
  stripeId?: string;
  subDomain?: string;
  systemUser?: mongoose.Schema.Types.ObjectId;
  billing?: ICompanyBilling;
  status: 'active' | 'inActive' | 'deactivated' | 'deleted';
  description?: string;
  plan: mongoose.Schema.Types.Mixed;
}

// Interface for the Company Model
export interface ICompanyModel extends Model<ICompanyDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewCreatedCompany = Partial<ICompanyDoc>;
export type UpdateCompanyBody = Partial<ICompanyDoc>;
