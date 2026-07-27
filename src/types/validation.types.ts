/* eslint-disable prettier/prettier */
/**
 * Validation System TypeScript Type Definitions
 *
 * Centralized type definitions for the validation system.
 */

import mongoose from 'mongoose';
import { ReferenceIssue, ReferenceAnalysisResult } from '../utils/referenceAnalyzer';

// ============================================================================
// Core Validation Types
// ============================================================================

export interface ValidationContext {
  applicationId: mongoose.Types.ObjectId;
  companyId: string;
  userId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  plugins?: any[];
}

export interface ValidationResult {
  isValid: boolean;
  issueCount: number;
  validation: ReferenceAnalysisResult;
  application: any;
  timestamp: Date;
}

export interface ValidationSummary {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// ============================================================================
// Fix Task Types
// ============================================================================

export type FixTaskType =
  | 'fix_auth_header'
  | 'create_controller'
  | 'create_view'
  | 'configure_plugin'
  | 'fix_element_reference';

export type FixTaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface FixTaskMetadata {
  originalIssueId?: string;
  attemptCount?: number;
  createdAt?: Date;
  lastAttemptAt?: Date;
  errors?: string[];
}

export interface FixTaskDetails {
  // For fix_auth_header
  viewId?: string;
  elementId?: string;
  endpoint?: {
    method: string;
    path: string;
  };

  // For create_controller
  method?: string;
  path?: string;
  name?: string;
  plugins?: Array<{
    type: string;
    order: number;
    config?: any;
    code?: string;
  }>;

  // For create_view
  viewName?: string;
  viewType?: 'public' | 'private';
  layout?: any[];
  viewConfiguration?: any;

  // For configure_plugin
  pluginType?: string;
  pluginId?: string;
  pluginConfiguration?: any;

  // For fix_element_reference
  targetId?: string;
  fixes?: any;
}

export interface FixTask {
  id: string;
  type: FixTaskType;
  priority: FixTaskPriority;
  description: string;
  details: FixTaskDetails;
  metadata?: FixTaskMetadata;
}

export interface FixTasksResponse {
  fixTasks: FixTask[];
  summary: {
    totalTasks: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  plannerNotes?: string;
}

// ============================================================================
// Task Execution Types
// ============================================================================

export interface TaskExecutionOptions {
  skipValidation?: boolean;
  maxValidationLoops?: number;
  autoFix?: boolean;
  minPriority?: FixTaskPriority;
}

export interface TaskExecutionError {
  taskId?: string;
  message: string;
  timestamp: Date;
  stack?: string;
}

export interface TaskExecutionResult {
  success: boolean;
  tasksCompleted: number;
  validationLoops: number;
  hadValidationIssues: boolean;
  finalValidation?: {
    isValid: boolean;
    remainingIssues: number;
  };
  executionLog: string[];
  errors: TaskExecutionError[];
}

// ============================================================================
// Orchestration Types
// ============================================================================

export interface ValidationOrchestrationOptions {
  skipValidation?: boolean;
  maxValidationLoops?: number;
  autoFix?: boolean;
  minPriority?: FixTaskPriority;
  onProgress?: (event: ValidationProgressEvent) => void;
}

export interface ValidationOrchestrationResult {
  success: boolean;
  executionResult: TaskExecutionResult;
  message: string;
  summary: {
    totalTasksExecuted: number;
    validationLoops: number;
    issuesFixed: number;
    remainingIssues: number;
    executionTime: number;
  };
}

export type ValidationProgressEventType =
  | 'validation_started'
  | 'validation_completed'
  | 'issues_detected'
  | 'fix_tasks_generated'
  | 'fix_tasks_executing'
  | 'fix_tasks_completed'
  | 'validation_passed'
  | 'validation_failed';

export interface ValidationProgressEvent {
  type: ValidationProgressEventType;
  timestamp: Date;
  data?: any;
}

// ============================================================================
// Formatter Types
// ============================================================================

export interface FormattedValidationContext {
  markdown: string;
  structured: {
    summary: ValidationSummary;
    issues: Array<{
      id: string;
      category: string;
      type: string;
      severity: FixTaskPriority;
      message: string;
      location: {
        viewId?: string;
        elementId?: string;
        controllerId?: string;
      };
      details: any;
      suggestedFixType: string;
    }>;
  };
}

// ============================================================================
// Planner Integration Types
// ============================================================================

export interface PlannerValidationContext {
  validationMode: boolean;
  validationIssues?: ReferenceAnalysisResult;
  formattedContext?: FormattedValidationContext;
}

export interface PlannerTask {
  id: string;
  title: string;
  type: 'ui' | 'controller' | 'resource' | 'application' | 'plugin';
  operation: string;
  dependencies: string[];
  prompt: string;
  expectedOutput: string;
  systemPromptKeys: string[];
  context: {
    viewId?: string;
    elementId?: string;
    controllerId?: string;
    pluginId?: string;
  };
}

export interface PlannerExecutionMap {
  messageType: 'execution_plan' | 'chat' | 'advice' | 'clarification';
  chatMessage?: string;
  requestSummary: string;
  tasks: PlannerTask[];
  questions?: any[];
  phases?: any[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ValidationConfig {
  enabled: boolean;
  maxValidationLoops: number;
  autoFix: boolean;
  minPriority: FixTaskPriority;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  retryFailedTasks: boolean;
  maxTaskRetries: number;
}

export interface ValidationSettings {
  userId: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  scope: 'global' | 'application' | 'conversation';
  resourceId?: mongoose.Types.ObjectId;
  config: Partial<ValidationConfig>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface ValidationStatistics {
  totalValidations: number;
  validApplications: number;
  invalidApplications: number;
  totalIssuesFound: number;
  totalIssuesFixed: number;
  averageValidationLoops: number;
  averageExecutionTime: number;
  issuesByType: Record<string, number>;
  fixSuccessRate: number;
}

export interface ValidationHistoryEntry {
  timestamp: Date;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  issuesFound: number;
  issuesFixed: number;
  validationLoops: number;
  executionTime: number;
  success: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FixTaskError extends Error {
  constructor(
    message: string,
    public taskId: string,
    public taskType: FixTaskType,
    public details?: any
  ) {
    super(message);
    this.name = 'FixTaskError';
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
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type ValidationCallback = (result: ValidationResult) => void | Promise<void>;

export type FixTaskCallback = (task: FixTask, result: { success: boolean; error?: Error }) => void | Promise<void>;

// ============================================================================
// Export all types
// ============================================================================

export type {
  ReferenceIssue,
  ReferenceAnalysisResult
} from '../utils/referenceAnalyzer';
