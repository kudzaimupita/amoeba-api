/* eslint-disable prettier/prettier */
/**
 * Validation System Error Utilities
 *
 * Centralized error handling and error classes for the validation system.
 */

import { logger } from './logger';

// ============================================================================
// Custom Error Classes
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

export class FixTaskError extends Error {
  constructor(
    message: string,
    public taskId: string,
    public taskType: string,
    public details?: any,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'FixTaskError';
    Object.setPrototypeOf(this, FixTaskError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      taskId: this.taskId,
      taskType: this.taskType,
      details: this.details,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

export class PlannerError extends Error {
  constructor(
    message: string,
    public conversationId: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PlannerError';
    Object.setPrototypeOf(this, PlannerError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      conversationId: this.conversationId,
      details: this.details,
      stack: this.stack
    };
  }
}

export class ValidationTimeoutError extends Error {
  constructor(
    message: string,
    public timeoutMs: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationTimeoutError';
    Object.setPrototypeOf(this, ValidationTimeoutError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      timeoutMs: this.timeoutMs,
      details: this.details,
      stack: this.stack
    };
  }
}

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Validation errors (1xxx)
  VALIDATION_FAILED: 'VAL_1001',
  VALIDATION_TIMEOUT: 'VAL_1002',
  VALIDATION_LOOP_EXCEEDED: 'VAL_1003',
  APPLICATION_NOT_FOUND: 'VAL_1004',
  INVALID_VALIDATION_RESULT: 'VAL_1005',

  // Fix task errors (2xxx)
  FIX_TASK_FAILED: 'FIX_2001',
  FIX_TASK_TIMEOUT: 'FIX_2002',
  FIX_TASK_INVALID: 'FIX_2003',
  FIX_TASK_NOT_FOUND: 'FIX_2004',
  FIX_TASK_RETRY_EXCEEDED: 'FIX_2005',

  // Planner errors (3xxx)
  PLANNER_FAILED: 'PLN_3001',
  PLANNER_TIMEOUT: 'PLN_3002',
  PLANNER_INVALID_RESPONSE: 'PLN_3003',
  PLANNER_NO_FIX_TASKS: 'PLN_3004',

  // Task execution errors (4xxx)
  TASK_EXECUTION_FAILED: 'TSK_4001',
  TASK_EXECUTION_TIMEOUT: 'TSK_4002',
  VIEW_NOT_FOUND: 'TSK_4003',
  ELEMENT_NOT_FOUND: 'TSK_4004',
  CONTROLLER_NOT_FOUND: 'TSK_4005',

  // System errors (5xxx)
  SYSTEM_ERROR: 'SYS_5001',
  CONFIGURATION_ERROR: 'SYS_5002',
  DEPENDENCY_ERROR: 'SYS_5003'
} as const;

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle validation error with logging and recovery
 */
export const handleValidationError = (
  error: any,
  context: {
    applicationId?: string;
    conversationId?: string;
    userId?: string;
  }
): ValidationError => {
  logger.error('[ValidationError]', {
    error: error.message,
    code: error.code || ERROR_CODES.VALIDATION_FAILED,
    context,
    stack: error.stack
  });

  if (error instanceof ValidationError) {
    return error;
  }

  return new ValidationError(
    error.message || 'Validation failed',
    error.code || ERROR_CODES.VALIDATION_FAILED,
    { originalError: error, context },
    false
  );
};

/**
 * Handle fix task error with retry logic
 */
export const handleFixTaskError = (
  error: any,
  taskId: string,
  taskType: string,
  attemptCount: number,
  maxRetries: number
): FixTaskError => {
  const canRetry = attemptCount < maxRetries;

  logger.error('[FixTaskError]', {
    error: error.message,
    taskId,
    taskType,
    attemptCount,
    maxRetries,
    canRetry,
    stack: error.stack
  });

  if (error instanceof FixTaskError) {
    return error;
  }

  return new FixTaskError(
    error.message || 'Fix task execution failed',
    taskId,
    taskType,
    { originalError: error, attemptCount, maxRetries },
    canRetry
  );
};

/**
 * Handle planner error with context
 */
export const handlePlannerError = (
  error: any,
  conversationId: string,
  context?: any
): PlannerError => {
  logger.error('[PlannerError]', {
    error: error.message,
    conversationId,
    context,
    stack: error.stack
  });

  if (error instanceof PlannerError) {
    return error;
  }

  return new PlannerError(
    error.message || 'Planner request failed',
    conversationId,
    { originalError: error, context }
  );
};

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Attempt to recover from validation error
 */
export const tryRecoverFromValidationError = async (
  error: ValidationError,
  fallbackFn?: () => Promise<any>
): Promise<any> => {
  if (error.recoverable && fallbackFn) {
    logger.info('[ValidationError] Attempting recovery with fallback function');
    try {
      return await fallbackFn();
    } catch (fallbackError) {
      logger.error('[ValidationError] Fallback recovery failed:', fallbackError);
      throw error;
    }
  }

  throw error;
};

/**
 * Retry fix task with exponential backoff
 */
export const retryFixTask = async (
  taskFn: () => Promise<any>,
  taskId: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(`[RetryFixTask] Attempt ${attempt + 1}/${maxRetries} for task ${taskId}`);
      return await taskFn();
    } catch (error) {
      lastError = error;
      logger.warn(`[RetryFixTask] Attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.info(`[RetryFixTask] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new FixTaskError(
    `Fix task failed after ${maxRetries} attempts`,
    taskId,
    'retry_exceeded',
    { lastError },
    false
  );
};

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format error for user display
 */
export const formatErrorForUser = (error: any): string => {
  if (error instanceof ValidationError) {
    return `Validation Error: ${error.message}`;
  }

  if (error instanceof FixTaskError) {
    return `Failed to fix issue: ${error.message}`;
  }

  if (error instanceof PlannerError) {
    return `Planning Error: ${error.message}`;
  }

  return `Error: ${error.message || 'Unknown error occurred'}`;
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error: any): any => {
  if (error instanceof ValidationError ||
      error instanceof FixTaskError ||
      error instanceof PlannerError) {
    return error.toJSON();
  }

  return {
    name: error.name || 'Error',
    message: error.message,
    stack: error.stack,
    ...error
  };
};

// ============================================================================
// Utilities
// ============================================================================

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error: any): boolean => {
  if (error instanceof ValidationError) {
    return error.recoverable;
  }

  if (error instanceof FixTaskError) {
    return error.retryable;
  }

  // Network errors are typically recoverable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
};

/**
 * Check if error should trigger alert
 */
export const shouldAlertOnError = (error: any): boolean => {
  // Don't alert on recoverable errors
  if (isRecoverableError(error)) {
    return false;
  }

  // Don't alert on validation loop exceeded (expected)
  if (error.code === ERROR_CODES.VALIDATION_LOOP_EXCEEDED) {
    return false;
  }

  // Alert on system errors
  if (error.code?.startsWith('SYS_')) {
    return true;
  }

  return false;
};

/**
 * Aggregate multiple errors into summary
 */
export const aggregateErrors = (errors: any[]): {
  total: number;
  recoverable: number;
  fatal: number;
  byType: Record<string, number>;
  messages: string[];
} => {
  return {
    total: errors.length,
    recoverable: errors.filter(isRecoverableError).length,
    fatal: errors.filter(e => !isRecoverableError(e)).length,
    byType: errors.reduce((acc, error) => {
      const type = error.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    messages: errors.map(e => e.message)
  };
};
