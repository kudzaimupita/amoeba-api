// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { checkCompanyPlanQuota, checkFeatureAccess, QuotaCheckOptions } from '../modules/company/billings';

/**
 * Middleware factory for quota enforcement
 * @param operation - The operation being performed (e.g., 'createApplication', 'createView')
 * @param options - Additional options for the quota check
 */
export const enforceQuota = (operation: string, options: QuotaCheckOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.applicationId || req.params.appId || req.body.applicationId || options.applicationId;

      await checkCompanyPlanQuota(req, operation, appId, {
        ...options,
        increment: options.increment || 1
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory for feature access enforcement
 * @param feature - The feature to check access for
 */
export const enforceFeatureAccess = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hasAccess = await checkFeatureAccess(req, feature as any);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature is not available in your current plan. Please upgrade to access ${feature}.`,
          feature,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware for bulk operations that need to check quota for multiple items
 * @param operation - The operation being performed
 * @param getCountFromRequest - Function to extract the count from request
 */
export const enforceBulkQuota = (
  operation: string,
  getCountFromRequest: (req: Request) => number
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = getCountFromRequest(req);
      const appId = req.params.applicationId || req.params.appId || req.body.applicationId;

      await checkCompanyPlanQuota(req, operation, appId, {
        increment: count
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Pre-configured middleware for common operations
 */
export const quotaMiddleware = {
  // Core resources
  applications: enforceQuota('createApplication'),
  users: enforceQuota('createUser'),
  plugins: enforceQuota('createPlugin'),
  components: enforceQuota('createComponent'),
  templates: enforceQuota('createHtmlTemplate'),

  // Per-app resources
  views: enforceQuota('createView'),
  viewsPerApp: enforceQuota('createViewPerApp'),
  controllers: enforceQuota('createController'),
  controllersPerApp: enforceQuota('createControllerPerApp'),
  secrets: enforceQuota('createSecret'),
  domains: enforceQuota('createDomain'),

  // Monthly limits
  deployments: enforceQuota('createDeployment'),
  invocations: enforceQuota('invokeController'),

  // Marketplace operations
  publishModule: enforceQuota('publishModule'),

  // Feature access
  customDomains: enforceFeatureAccess('customDomains'),
  sso: enforceFeatureAccess('sso'),
  rbac: enforceFeatureAccess('rbac'),
  audit: enforceFeatureAccess('audit'),
  whiteLabel: enforceFeatureAccess('whiteLabel'),
  backups: enforceFeatureAccess('backups'),
  prioritySupport: enforceFeatureAccess('prioritySupport'),
  advancedAnalytics: enforceFeatureAccess('advancedAnalytics'),

  // Bulk operations
  bulkSecrets: enforceBulkQuota('createSecret', (req) => req.body.secrets?.length || 0),
  bulkUsers: enforceBulkQuota('createUser', (req) => req.body.users?.length || 0)
};

/**
 * Helper function to create custom quota middleware for specific operations
 */
export const createQuotaMiddleware = (operation: string, options: QuotaCheckOptions = {}) => {
  return enforceQuota(operation, options);
};

/**
 * Middleware to check storage limits before file uploads
 */
export const enforceStorageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This would need to be implemented based on your file upload system
    // Check current storage usage and compare against plan limits
    await checkCompanyPlanQuota(req, 'checkStorageLimit', undefined, {
      increment: req.body.fileSize || 0
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate plan-specific configurations
 */
export const validatePlanConfiguration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add validation logic for plan-specific configurations
    // For example, check if advanced features are being configured on basic plans

    next();
  } catch (error) {
    next(error);
  }
};