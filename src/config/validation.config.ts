/* eslint-disable prettier/prettier */
/**
 * Validation System Configuration
 *
 * Central configuration for the validation system.
 * Override these values via environment variables or runtime config.
 */

export interface ValidationSystemConfig {
  // Core settings
  enabled: boolean;
  maxValidationLoops: number;
  autoFix: boolean;

  // Priority settings
  minPriority: 'critical' | 'high' | 'medium' | 'low';

  // Retry settings
  retryFailedTasks: boolean;
  maxTaskRetries: number;

  // Performance settings
  timeoutPerTask: number; // milliseconds
  maxConcurrentFixes: number;

  // Logging settings
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logValidationDetails: boolean;
  logFixTaskDetails: boolean;

  // Feature flags
  enableDeterministicFixes: boolean;
  enablePlannerFixes: boolean;
  enableValidationMetrics: boolean;

  // Auth settings
  authExemptPaths: string[];
  alwaysAddAuthMiddleware: boolean;
  alwaysAddBearerToken: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationSystemConfig = {
  // Core settings
  enabled: process.env.VALIDATION_ENABLED !== 'false',
  maxValidationLoops: parseInt(process.env.MAX_VALIDATION_LOOPS || '3', 10),
  autoFix: process.env.VALIDATION_AUTO_FIX !== 'false',

  // Priority settings
  minPriority: (process.env.VALIDATION_MIN_PRIORITY as any) || 'low',

  // Retry settings
  retryFailedTasks: process.env.VALIDATION_RETRY_FAILED !== 'false',
  maxTaskRetries: parseInt(process.env.VALIDATION_MAX_RETRIES || '2', 10),

  // Performance settings
  timeoutPerTask: parseInt(process.env.VALIDATION_TASK_TIMEOUT || '30000', 10), // 30s
  maxConcurrentFixes: parseInt(process.env.VALIDATION_MAX_CONCURRENT || '5', 10),

  // Logging settings
  logLevel: (process.env.VALIDATION_LOG_LEVEL as any) || 'info',
  logValidationDetails: process.env.VALIDATION_LOG_DETAILS !== 'false',
  logFixTaskDetails: process.env.VALIDATION_LOG_FIX_DETAILS !== 'false',

  // Feature flags
  enableDeterministicFixes: process.env.VALIDATION_DETERMINISTIC_FIXES !== 'false',
  enablePlannerFixes: process.env.VALIDATION_PLANNER_FIXES !== 'false',
  enableValidationMetrics: process.env.VALIDATION_METRICS !== 'false',

  // Auth settings
  authExemptPaths: [
    '/login',
    '/logout',
    '/register',
    '/signup',
    '/signin',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/refresh-token'
  ],
  alwaysAddAuthMiddleware: true,
  alwaysAddBearerToken: true
};

/**
 * Runtime configuration (can be modified at runtime)
 */
let runtimeConfig: ValidationSystemConfig = { ...DEFAULT_VALIDATION_CONFIG };

/**
 * Get current validation configuration
 */
export const getValidationConfig = (): ValidationSystemConfig => {
  return { ...runtimeConfig };
};

/**
 * Update validation configuration at runtime
 */
export const updateValidationConfig = (updates: Partial<ValidationSystemConfig>): void => {
  runtimeConfig = {
    ...runtimeConfig,
    ...updates
  };
};

/**
 * Reset to default configuration
 */
export const resetValidationConfig = (): void => {
  runtimeConfig = { ...DEFAULT_VALIDATION_CONFIG };
};

/**
 * Check if validation is enabled
 */
export const isValidationEnabled = (): boolean => {
  return runtimeConfig.enabled;
};

/**
 * Check if a path is auth-exempt
 */
export const isAuthExemptPath = (path: string): boolean => {
  const normalizedPath = path.toLowerCase();
  return runtimeConfig.authExemptPaths.some(exemptPath =>
    normalizedPath.includes(exemptPath.toLowerCase())
  );
};

/**
 * Get max validation loops
 */
export const getMaxValidationLoops = (): number => {
  return runtimeConfig.maxValidationLoops;
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS: Record<string, Partial<ValidationSystemConfig>> = {
  development: {
    logLevel: 'debug',
    logValidationDetails: true,
    logFixTaskDetails: true,
    maxValidationLoops: 3
  },

  staging: {
    logLevel: 'info',
    logValidationDetails: true,
    logFixTaskDetails: false,
    maxValidationLoops: 3
  },

  production: {
    logLevel: 'warn',
    logValidationDetails: false,
    logFixTaskDetails: false,
    maxValidationLoops: 2
  },

  test: {
    enabled: false,
    logLevel: 'error',
    maxValidationLoops: 1
  }
};

/**
 * Apply environment-specific configuration
 */
export const applyEnvironmentConfig = (environment: string): void => {
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  if (envConfig) {
    updateValidationConfig(envConfig);
  }
};

/**
 * Configuration presets
 */
export const VALIDATION_PRESETS = {
  strict: {
    enabled: true,
    autoFix: true,
    maxValidationLoops: 5,
    minPriority: 'low' as const,
    retryFailedTasks: true,
    alwaysAddAuthMiddleware: true,
    alwaysAddBearerToken: true
  },

  balanced: {
    enabled: true,
    autoFix: true,
    maxValidationLoops: 3,
    minPriority: 'medium' as const,
    retryFailedTasks: true,
    alwaysAddAuthMiddleware: true,
    alwaysAddBearerToken: true
  },

  permissive: {
    enabled: true,
    autoFix: true,
    maxValidationLoops: 2,
    minPriority: 'high' as const,
    retryFailedTasks: false,
    alwaysAddAuthMiddleware: true,
    alwaysAddBearerToken: false
  },

  disabled: {
    enabled: false,
    autoFix: false,
    maxValidationLoops: 0
  }
};

/**
 * Apply a configuration preset
 */
export const applyValidationPreset = (presetName: keyof typeof VALIDATION_PRESETS): void => {
  const preset = VALIDATION_PRESETS[presetName];
  if (preset) {
    updateValidationConfig(preset);
  }
};
