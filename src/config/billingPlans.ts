// @ts-nocheck
/**
 * Billing Plans Configuration
 * Defines all subscription plans and their limits
 */

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

export interface BillingPlanLimits {
  // Core Resources
  applications: number;
  views: number; // Total views across all applications
  controllers: number; // Total controllers across all applications
  users: number; // Team members/users in company
  plugins: number; // Resources/plugins that can be created
  modules: number; // Number of modules/components

  // Monthly Limits (reset monthly)
  deployments: number; // Deployments per month

  // Per Application Limits
  viewsPerApp: number; // Views per single application
  controllersPerApp: number; // Controllers per single application
  domainsPerApp: number; // Custom domains per application
  secretsPerApp: number; // Secrets per application

  // Marketplace Features
  marketplacePublications: number; // Number of modules that can be published to marketplace

  // Additional Features
  storageGB: number; // Storage in GB
  invocations: number; // API invocations per month
  customDomains: boolean; // Can use custom domains
  prioritySupport: boolean; // Priority customer support
  advancedAnalytics: boolean; // Advanced analytics features
  backups: boolean; // Automated backups
  sslCertificates: boolean; // SSL certificates

  // Enterprise Features
  sso: boolean; // Single Sign-On
  rbac: boolean; // Role-Based Access Control
  audit: boolean; // Audit logs
  whiteLabel: boolean; // White label branding
  dedicatedSupport: boolean; // Dedicated support representative
  sla: boolean; // Service Level Agreement
}

export const BILLING_PLANS: Record<PlanType, BillingPlanLimits> = {
  [PlanType.FREE]: {
    // Core Resources
    applications: 2,
    views: 10,
    controllers: 15,
    users: 3,
    plugins: 5,
    modules: 20,

    // Monthly Limits
    deployments: 30,

    // Per Application Limits
    viewsPerApp: 5,
    controllersPerApp: 8,
    domainsPerApp: 10, // No custom domains
    secretsPerApp: 5,

    // Marketplace Features
    marketplacePublications: 10, // No marketplace publishing

    // Additional Features
    storageGB: 1,
    invocations: 10000,
    customDomains: false,
    prioritySupport: false,
    advancedAnalytics: false,
    backups: false,
    sslCertificates: false,

    // Enterprise Features
    sso: false,
    rbac: false,
    audit: false,
    whiteLabel: false,
    dedicatedSupport: false,
    sla: false
  },

  [PlanType.BASIC]: {
    // Core Resources
    applications: 5,
    views: 50,
    controllers: 75,
    users: 10,
    plugins: 20,
    modules: 100,

    // Monthly Limits
    deployments: 100,

    // Per Application Limits
    viewsPerApp: 15,
    controllersPerApp: 20,
    domainsPerApp: 1,
    secretsPerApp: 20,

    // Marketplace Features
    marketplacePublications: 10, // Can publish 2 modules

    // Additional Features
    storageGB: 5,
    invocations: 50000,
    customDomains: true,
    prioritySupport: false,
    advancedAnalytics: false,
    backups: true,
    sslCertificates: true,

    // Enterprise Features
    sso: false,
    rbac: false,
    audit: false,
    whiteLabel: false,
    dedicatedSupport: false,
    sla: false
  },

  [PlanType.PRO]: {
    // Core Resources
    applications: 15,
    views: 200,
    controllers: 300,
    users: 25,
    plugins: 75,
    modules: 500,

    // Monthly Limits
    deployments: 500,

    // Per Application Limits
    viewsPerApp: 50,
    controllersPerApp: 75,
    domainsPerApp: 3,
    secretsPerApp: 100,

    // Marketplace Features
    marketplacePublications: 10, // Can publish 10 modules

    // Additional Features
    storageGB: 25,
    invocations: 250000,
    customDomains: true,
    prioritySupport: true,
    advancedAnalytics: true,
    backups: true,
    sslCertificates: true,

    // Enterprise Features
    sso: false,
    rbac: true,
    audit: false,
    whiteLabel: false,
    dedicatedSupport: false,
    sla: false
  },

  [PlanType.BUSINESS]: {
    // Core Resources
    applications: 50,
    views: 1000,
    controllers: 1500,
    users: 100,
    plugins: 300,
    modules: 2000,

    // Monthly Limits
    deployments: 2000,

    // Per Application Limits
    viewsPerApp: 200,
    controllersPerApp: 300,
    domainsPerApp: 10,
    secretsPerApp: 500,

    // Marketplace Features
    marketplacePublications: 50, // Can publish 50 modules

    // Additional Features
    storageGB: 100,
    invocations: 1000000,
    customDomains: true,
    prioritySupport: true,
    advancedAnalytics: true,
    backups: true,
    sslCertificates: true,

    // Enterprise Features
    sso: true,
    rbac: true,
    audit: true,
    whiteLabel: true,
    dedicatedSupport: false,
    sla: true
  },

  [PlanType.ENTERPRISE]: {
    // Core Resources - Unlimited for enterprise
    applications: -1, // -1 indicates unlimited
    views: -1,
    controllers: -1,
    users: -1,
    plugins: -1,
    modules: -1,

    // Monthly Limits - Custom for enterprise
    deployments: -1, // Custom limit set per customer

    // Per Application Limits
    viewsPerApp: -1,
    controllersPerApp: -1,
    domainsPerApp: -1,
    secretsPerApp: -1,

    // Marketplace Features
    marketplacePublications: -1, // Unlimited marketplace publishing

    // Additional Features
    storageGB: -1, // Custom storage allocation
    invocations: -1, // Custom invocation limits
    customDomains: true,
    prioritySupport: true,
    advancedAnalytics: true,
    backups: true,
    sslCertificates: true,

    // Enterprise Features
    sso: true,
    rbac: true,
    audit: true,
    whiteLabel: true,
    dedicatedSupport: true,
    sla: true
  }
};

/**
 * Plan pricing information (for reference and display)
 */
export const PLAN_PRICING = {
  [PlanType.FREE]: {
    monthly: 0,
    yearly: 0,
    currency: 'USD'
  },
  [PlanType.BASIC]: {
    monthly: 19,
    yearly: 190, // 10 months price
    currency: 'USD'
  },
  [PlanType.PRO]: {
    monthly: 199,
    yearly: 1990, // 10 months price
    currency: 'USD'
  },
  [PlanType.BUSINESS]: {
    monthly: 599,
    yearly: 5990, // 10 months price
    currency: 'USD'
  },
  [PlanType.ENTERPRISE]: {
    monthly: 'Custom',
    yearly: 'Custom',
    currency: 'USD'
  }
};

/**
 * Feature descriptions for marketing/display purposes
 */
export const PLAN_FEATURES = {
  [PlanType.FREE]: [
    '2 Applications',
    '10 Total Views',
    '15 Total Controllers',
    '3 Team Members',
    '5 Resources',
    '30 Deployments/month',
    '1GB Storage',
    '10K API Calls/month',
    'Community Support'
  ],
  [PlanType.BASIC]: [
    '5 Applications',
    '50 Total Views',
    '75 Total Controllers',
    '10 Team Members',
    '20 Resources',
    '100 Deployments/month',
    '5GB Storage',
    '50K API Calls/month',
    'Custom Domains',
    'SSL Certificates',
    'Automated Backups',
    'Email Support'
  ],
  [PlanType.PRO]: [
    '15 Applications',
    '200 Total Views',
    '300 Total Controllers',
    '25 Team Members',
    '75 Resources',
    '500 Deployments/month',
    '25GB Storage',
    '250K API Calls/month',
    'Priority Support',
    'Advanced Analytics',
    'Role-Based Access Control',
    'Everything in Basic'
  ],
  [PlanType.BUSINESS]: [
    '50 Applications',
    '1,000 Total Views',
    '1,500 Total Controllers',
    '100 Team Members',
    '300 Resources',
    '2,000 Deployments/month',
    '100GB Storage',
    '1M API Calls/month',
    'SSO Integration',
    'Audit Logs',
    'White Label Branding',
    'SLA Guarantee',
    'Everything in Pro'
  ],
  [PlanType.ENTERPRISE]: [
    'Unlimited Applications',
    'Unlimited Views',
    'Unlimited Controllers',
    'Unlimited Team Members',
    'Unlimited Resources',
    'Custom Deployment Limits',
    'Custom Storage',
    'Custom API Limits',
    'Dedicated Support Rep',
    'Custom Integrations',
    'On-premise Deployment',
    'Everything in Business',
    'Custom Contract Terms'
  ]
};

/**
 * Helper function to get plan limits for a specific plan type
 */
export function getPlanLimits(planType: PlanType): BillingPlanLimits {
  return BILLING_PLANS[planType];
}

/**
 * Helper function to check if a value is unlimited (-1)
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Helper function to get formatted limit display
 */
export function getFormattedLimit(value: number): string {
  return isUnlimited(value) ? 'Unlimited' : value.toString();
}

/**
 * Helper function to validate if an operation is allowed for a plan
 */
export function isOperationAllowed(planType: PlanType, resource: keyof BillingPlanLimits, currentCount: number): boolean {
  const limits = getPlanLimits(planType);
  const limit = limits[resource];

  // If unlimited, always allow
  if (isUnlimited(limit as number)) {
    return true;
  }

  // Check if current count is below limit
  return currentCount < (limit as number);
}