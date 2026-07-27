export type BillingPlanType = string;

interface QuotaCheckOptions {
  increment?: number;
}

export const checkCompanyPlanQuota = (
  _req: { user?: { company?: { billing?: { plan?: string }; _id?: unknown } } },
  _operation: string,
  _options?: QuotaCheckOptions
) => {
  // Extend here when plan limits are needed.
};
