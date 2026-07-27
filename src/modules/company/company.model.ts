import mongoose from 'mongoose';
import { ICompanyDoc, ICompanyModel } from './company.interfaces';
import { PlanType } from '../../config/billingPlans';

import paginate from '../../utils/paginate/paginate';
import toJSON from '../../utils/toJSON/toJSON';

const companySchema = new mongoose.Schema<ICompanyDoc, ICompanyModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
    },
    currency: {
      type: String,
    },
    timeZone: {
      type: String,
    },
    industry: {
      type: String,
    },
    tokenExpire: {
      type: String,
    },
    mainObjective: {
      type: String,
    },
    trialStartDate: {
      type: Date,
      default: Date.now(),
    },
    trialEndDate: {
      type: Date,
      default: Date.now() + 1209600000,
    },
    trialEnded: {
      type: Boolean,
      default: false,
    },
    setDefaultData: {
      type: Boolean,
      default: false,
    },
    sessionTime: {
      type: String,
    },
    imageCover: {
      type: String,
    },
    logo: {
      type: String,
    },
    subDomain: {
      type: String,
    },
    systemUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    billing: {
      plan: {
        type: String,
        enum: Object.values(PlanType),
        default: PlanType.FREE,
        required: true
      },
      customLimits: {
        type: Object,
        default: undefined
      },
      monthlyUsage: {
        deployments: {
          type: Number,
          default: 0
        },
        invocations: {
          type: Number,
          default: 0
        },
        lastReset: {
          type: Date,
          default: Date.now
        }
      },
      stripeCustomerId: {
        type: String
      },
      stripeSubscriptionId: {
        type: String
      },
      paymentMethod: {
        type: String
      },
      billingInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
      },
      nextBillingDate: {
        type: Date
      },
      trialEndsAt: {
        type: Date
      },
      isTrialActive: {
        type: Boolean,
        default: false
      },
      features: [{
        type: String
      }]
    },
    status: {
      type: String,
      trim: true,
      default: 'active',
      enum: ['active', 'inActive', 'deactivated', 'deleted'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
companySchema.index({ systemUser: 1 });
// add plugin that converts mongoose to json
companySchema.plugin(toJSON);
companySchema.plugin(paginate);

const Company = mongoose.model<ICompanyDoc, ICompanyModel>('Company', companySchema);

export default Company;
