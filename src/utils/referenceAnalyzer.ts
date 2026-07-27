/* eslint-disable prettier/prettier */
/**
 * Reference Analyzer Utility
 *
 * Simple issue detection - just identifies what's broken.
 * NO smart logic, NO case-insensitive matching, NO regex.
 * The AI Planner handles all intelligence and decision-making.
 */

import { logger } from './logger';

export interface ReferenceIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  viewId?: string;
  elementId?: string;
  controllerId?: string;
  details: any;
}

export interface ReferenceAnalysisResult {
  isValid: boolean;
  issueCount: number;
  issues: ReferenceIssue[];
  summary: {
    navigation: number;
    endpoint: number;
    authHeader: number;
    plugin: number;
    element: number;
  };
}

/**
 * Analyze application for reference issues
 *
 * Simple detection only - the planner decides how to fix
 */
export function analyzeReferenceDiagnostics(
  application: any,
  availablePlugins: any[] // Available plugins to validate against
): ReferenceAnalysisResult {
  const issues: ReferenceIssue[] = [];
  let issueId = 0;

  if (!application) {
    return {
      isValid: true,
      issueCount: 0,
      issues: [],
      summary: { navigation: 0, endpoint: 0, authHeader: 0, plugin: 0, element: 0 }
    };
  }

  const views = application.views || [];
  const controllers = application.controllers || [];
  const viewIds = views.map((v: any) => v.id);
  const controllerPaths = controllers.map((c: any) => c.path);

  // Get available plugin IDs
  const pluginIds = availablePlugins.map((p: any) =>
    p._id?.toString() || p.id?.toString() || p._id || p.id
  );

  // Auth-exempt paths (don't need auth headers or auth middleware)
  const authExemptKeywords = [
    'login', 'logout', 'register', 'signup', 'signin',
    'forgot', 'reset', 'password', 'verify'
  ];

  const isAuthExempt = (path: string) => {
    const normalized = path.toLowerCase();
    return authExemptKeywords.some(keyword => normalized.includes(keyword));
  };

  // Check each view for issues
  views.forEach((view: any) => {
    const layout = view.layout || [];

    // Check each element in the view
    layout.forEach((element: any) => {
      const config = element.configuration || {};
      const handlers = config.onClick || config.onSubmit || config.onLoad || {};

      // Check navigation calls
      if (handlers.plugins) {
        handlers.plugins.forEach((plugin: any) => {
          // Check navigateToView calls
          if (plugin.executeCode && typeof plugin.executeCode === 'string') {
            const navMatches = plugin.executeCode.match(/navigateToView\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
            if (navMatches) {
              navMatches.forEach((match: string) => {
                const targetMatch = match.match(/['"`]([^'"`]+)['"`]/);
                if (targetMatch) {
                  const targetViewId = targetMatch[1];

                  // Simple check: does this view ID exist?
                  if (!viewIds.includes(targetViewId)) {
                    issues.push({
                      id: `nav-${++issueId}`,
                      type: 'missing-navigation-target',
                      severity: 'high',
                      message: `Navigation target '${targetViewId}' not found`,
                      viewId: view.id,
                      elementId: element.i,
                      details: {
                        targetViewId,
                        existingViews: viewIds,
                        sourceElement: element.name || element.i
                      }
                    });
                  }
                }
              });
            }
          }

          // Check HTTP calls (shortcuts.http.*)
          if (plugin.executeCode && typeof plugin.executeCode === 'string') {
            const httpMatches = plugin.executeCode.match(/shortcuts\.http\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi);
            if (httpMatches) {
              httpMatches.forEach((match: string) => {
                const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
                if (urlMatch) {
                  const endpoint = urlMatch[1];

                  // Simple check: does this endpoint have a controller?
                  if (!controllerPaths.includes(endpoint)) {
                    issues.push({
                      id: `endpoint-${++issueId}`,
                      type: 'missing-endpoint',
                      severity: 'high',
                      message: `Endpoint '${endpoint}' has no controller`,
                      viewId: view.id,
                      elementId: element.i,
                      details: {
                        endpoint,
                        method: match.match(/\.(get|post|put|patch|delete)/i)?.[1]?.toUpperCase() || 'GET',
                        existingEndpoints: controllerPaths,
                        sourceElement: element.name || element.i
                      }
                    });
                  }

                  // Simple check: does this call have auth headers? (unless exempt)
                  if (!isAuthExempt(endpoint)) {
                    const fullCode = plugin.executeCode;
                    const hasAuthHeader = fullCode.includes('Authorization') ||
                                        fullCode.includes('Bearer') ||
                                        fullCode.match(/headers\s*:\s*\{[^}]*Authorization/i);

                    if (!hasAuthHeader) {
                      issues.push({
                        id: `auth-${++issueId}`,
                        type: 'missing-auth-header',
                        severity: 'critical',
                        message: `Protected endpoint '${endpoint}' missing auth header`,
                        viewId: view.id,
                        elementId: element.i,
                        details: {
                          endpoint,
                          sourceElement: element.name || element.i
                        }
                      });
                    }
                  }
                }
              });
            }
          }
        });
      }
    });
  });

  // Check controllers for missing auth middleware
  controllers.forEach((controller: any) => {
    const path = controller.path || '';
    const plugins = controller.plugins || [];

    // Simple check: does controller have auth plugin? (unless exempt)
    if (!isAuthExempt(path)) {
      const hasAuth = plugins.some((p: any) => p.type === 'auth');

      if (!hasAuth) {
        issues.push({
          id: `ctrl-auth-${++issueId}`,
          type: 'missing-controller-auth',
          severity: 'high',
          message: `Controller '${path}' missing auth() middleware`,
          controllerId: controller.id || controller._id,
          details: {
            path,
            method: controller.method,
            controllerName: controller.name
          }
        });
      }
    }

    // Check for setPlugins() calls in executeCode
    const steps = controller.steps || [];
    steps.forEach((step: any) => {
      if (step.type === 'executeCode' && step.code) {
        const code = step.code;

        // Simple regex to find setPlugins({ ... }) calls
        const setPluginsMatches = code.match(/setPlugins\s*\(\s*\{([^}]+)\}\s*\)/g);

        if (setPluginsMatches) {
          setPluginsMatches.forEach((match: string) => {
            // Extract the object content
            const objMatch = match.match(/\{([^}]+)\}/);
            if (objMatch) {
              const objContent = objMatch[1];

              // Simple parse: key: 'value' or key: "value"
              const pluginRefs = objContent.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/g);

              if (pluginRefs) {
                pluginRefs.forEach((ref: string) => {
                  const parts = ref.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/);
                  if (parts) {
                    const pluginType = parts[1]; // e.g., 'drive', 'mongo', 'auth'
                    const pluginId = parts[2];    // e.g., '507f1f77bcf86cd799439011'

                    // Simple check: does this plugin ID exist in available plugins?
                    if (!pluginIds.includes(pluginId)) {
                      issues.push({
                        id: `plugin-${++issueId}`,
                        type: 'missing-plugin',
                        severity: 'high',
                        message: `Controller references missing ${pluginType} plugin: ${pluginId}`,
                        controllerId: controller.id || controller._id,
                        details: {
                          path,
                          controllerName: controller.name,
                          pluginType,
                          pluginId,
                          stepName: step.name,
                          availablePlugins: pluginIds
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  });

  // Calculate summary
  const summary = {
    navigation: issues.filter(i => i.type === 'missing-navigation-target').length,
    endpoint: issues.filter(i => i.type === 'missing-endpoint').length,
    authHeader: issues.filter(i => i.type === 'missing-auth-header').length,
    plugin: issues.filter(i => i.type === 'missing-plugin').length,
    element: 0 // Reserved for future element checks
  };

  const result = {
    isValid: issues.length === 0,
    issueCount: issues.length,
    issues,
    summary
  };

  if (issues.length > 0) {
    logger.info(`[ReferenceAnalyzer] Found ${issues.length} issues in application ${application.name || application.id}`);
  }

  return result;
}

/**
 * Format reference issue details for display
 */
export function formatReferenceIssueDetails(issue: ReferenceIssue): string {
  const parts = [
    `Type: ${issue.type}`,
    `Severity: ${issue.severity}`,
    `Message: ${issue.message}`
  ];

  if (issue.viewId) parts.push(`View: ${issue.viewId}`);
  if (issue.elementId) parts.push(`Element: ${issue.elementId}`);
  if (issue.controllerId) parts.push(`Controller: ${issue.controllerId}`);

  return parts.join('\n');
}

/**
 * Describe issue type in human-readable format
 */
export function describeReferenceIssueType(type: string): string {
  const descriptions: Record<string, string> = {
    'missing-navigation-target': 'Navigation target view does not exist',
    'missing-endpoint': 'API endpoint has no matching controller',
    'missing-auth-header': 'Protected API call missing Authorization header',
    'missing-controller-auth': 'Controller missing auth() middleware plugin',
    'missing-plugin': 'Controller references plugin that is not configured',
    'broken-element-reference': 'Element reference is invalid'
  };

  return descriptions[type] || 'Unknown issue type';
}
