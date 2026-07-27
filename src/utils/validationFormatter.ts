/* eslint-disable prettier/prettier */
/**
 * Validation Formatter Utility
 *
 * Formats validation issues from analyzeReferenceDiagnostics into
 * a structured format that the AI Planner can consume and create fix tasks from.
 */

import { ReferenceAnalysisResult, ReferenceIssue } from './referenceAnalyzer';
import { logger } from './logger';

type IssueCategory = 'navigation' | 'endpoint' | 'plugin' | 'element';
type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

interface GroupedIssues {
  navigation: ReferenceIssue[];
  endpoint: ReferenceIssue[];
  plugin: ReferenceIssue[];
  element: ReferenceIssue[];
}

interface NormalizedIssueDetails {
  method?: string;
  path?: string;
  endpoint?: string;
  targetId?: string;
  pluginId?: string;
  pluginType?: string;
  snippet?: string;
  sourceElement?: string;
  [key: string]: any;
}

export interface FormattedValidationContext {
  markdown: string;
  structured: {
    summary: {
      total: number;
      byCategory: Record<string, number>;
      bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
    issues: Array<{
      id: string;
      category: IssueCategory;
      type: string;
      severity: IssueSeverity;
      message: string;
      location: {
        viewId?: string;
        elementId?: string;
        controllerId?: string;
      };
      details: NormalizedIssueDetails;
      suggestedFixType: string;
    }>;
  };
}

/**
 * Main function to format validation issues for the planner
 */
export const formatIssuesForPlanner = (
  validation: ReferenceAnalysisResult,
  application: any
): FormattedValidationContext => {
  try {
    logger.info('[ValidationFormatter] Formatting validation issues for planner');
    logger.info(`[ValidationFormatter] Total issues: ${validation.issues.length}`);

    const grouped = groupIssuesByCategory(validation.issues);
    const structured = buildStructuredContext(validation, grouped);
    const markdown = buildMarkdownContext(validation, grouped, application);

    return {
      markdown,
      structured
    };
  } catch (error: any) {
    logger.error('[ValidationFormatter] Error formatting issues:', error);
    throw new Error(`Failed to format validation issues: ${error.message}`);
  }
};

const deriveIssueCategory = (issue: ReferenceIssue): IssueCategory => {
  switch (issue.type) {
    case 'missing-navigation-target':
      return 'navigation';
    case 'missing-endpoint':
    case 'missing-auth-header':
    case 'missing-controller-auth':
      return 'endpoint';
    case 'missing-plugin':
      return 'plugin';
    default:
      return 'element';
  }
};

const normalizeIssueDetails = (issue: ReferenceIssue): NormalizedIssueDetails => {
  const details = (issue.details ?? {}) as Record<string, any>;
  const endpoint =
    typeof details.endpoint === 'string'
      ? details.endpoint
      : typeof details.path === 'string'
        ? details.path
        : undefined;
  const method = typeof details.method === 'string' ? details.method : undefined;
  const targetId =
    details.targetId ??
    details.targetViewId ??
    details.elementId ??
    details.controllerId ??
    undefined;

  const snippet =
    typeof details.snippet === 'string'
      ? details.snippet
      : typeof details.code === 'string'
        ? details.code
        : typeof details.executeCode === 'string'
          ? details.executeCode
          : undefined;

  const sourceElement =
    typeof details.sourceElement === 'string'
      ? details.sourceElement
      : typeof details.source === 'string'
        ? details.source
        : undefined;

  return {
    ...details,
    endpoint,
    method,
    path: typeof details.path === 'string' ? details.path : endpoint,
    targetId,
    pluginId: details.pluginId,
    pluginType: details.pluginType,
    snippet,
    sourceElement
  };
};

const groupIssuesByCategory = (issues: ReferenceIssue[]): GroupedIssues => {
  const grouped: GroupedIssues = {
    navigation: [],
    endpoint: [],
    plugin: [],
    element: []
  };

  issues.forEach(issue => {
    const category = deriveIssueCategory(issue);
    grouped[category].push(issue);
  });

  return grouped;
};

const getIssueSeverity = (issue: ReferenceIssue): IssueSeverity => {
  if (issue.type === 'missing-auth-header') {
    return 'critical';
  }

  if (
    issue.type === 'missing-endpoint' ||
    issue.type === 'missing-navigation-target' ||
    issue.type === 'missing-controller-auth'
  ) {
    return 'high';
  }

  if (issue.type === 'missing-plugin') {
    return 'medium';
  }

  return 'low';
};

const suggestFixType = (issue: ReferenceIssue): string => {
  switch (issue.type) {
    case 'missing-auth-header':
      return 'fix_auth_header';
    case 'missing-endpoint':
      return 'create_controller';
    case 'missing-navigation-target':
      return 'create_view';
    case 'missing-plugin':
      return 'configure_plugin';
    case 'missing-controller-auth':
      return 'configure_plugin';
    default:
      return 'fix_element_reference';
  }
};

const buildStructuredContext = (
  validation: ReferenceAnalysisResult,
  grouped: GroupedIssues
): FormattedValidationContext['structured'] => {
  const issues = validation.issues.map(issue => {
    const category = deriveIssueCategory(issue);
    const severity = getIssueSeverity(issue);
    const details = normalizeIssueDetails(issue);

    return {
      id: issue.id,
      category,
      type: issue.type,
      severity,
      message: issue.message,
      location: {
        viewId: issue.viewId,
        elementId: issue.elementId,
        controllerId: issue.controllerId
      },
      details,
      suggestedFixType: suggestFixType(issue)
    };
  });

  const byCategory: Record<string, number> = {};
  (Object.keys(grouped) as IssueCategory[]).forEach(category => {
    byCategory[category] = grouped[category].length;
  });

  const bySeverity = issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<IssueSeverity, number>
  );

  return {
    summary: {
      total: validation.issues.length,
      byCategory,
      bySeverity
    },
    issues
  };
};

const buildMarkdownContext = (
  validation: ReferenceAnalysisResult,
  grouped: GroupedIssues,
  application: any
): string => {
  const navMissing = validation.summary?.navigation ?? 0;
  const endpointMissing = validation.summary?.endpoint ?? 0;
  const authMissing = validation.summary?.authHeader ?? 0;
  const pluginMissing = validation.summary?.plugin ?? 0;

  const criticalCount = grouped.endpoint.filter(i => i.type === 'missing-auth-header').length;
  const highCount =
    grouped.navigation.length +
    grouped.endpoint.filter(
      i => i.type === 'missing-endpoint' || i.type === 'missing-controller-auth'
    ).length;
  const mediumCount = grouped.plugin.length;
  const lowCount = grouped.element.length;

  let markdown = `
# Post-Execution Validation Report

Validation detected **${validation.issues.length} issue(s)** after executing the requested tasks.

## Validation Summary

- Missing navigation targets: **${navMissing}**
- Missing API endpoints: **${endpointMissing}**
- Missing auth headers: **${authMissing}**
- Missing plugins: **${pluginMissing}**

**Severity breakdown**
- Critical: ${criticalCount} (address immediately)
- High: ${highCount} (high priority fixes)
- Medium: ${mediumCount} (recommended fixes)
- Low: ${lowCount} (nice to have)

---

## Detailed Issues by Category

`;

  if (grouped.navigation.length > 0) {
    markdown += formatNavigationIssues(grouped.navigation);
  }

  if (grouped.endpoint.length > 0) {
    markdown += formatEndpointIssues(grouped.endpoint);
  }

  if (grouped.plugin.length > 0) {
    markdown += formatPluginIssues(grouped.plugin);
  }

  if (grouped.element.length > 0) {
    markdown += formatElementIssues(grouped.element);
  }

  markdown += buildFixInstructions(validation.issues);
  markdown += buildApplicationContext(application);

  return markdown;
};

const formatNavigationIssues = (issues: ReferenceIssue[]): string => {
  if (issues.length === 0) return '';

  let output = `### Navigation Issues (${issues.length})\n\n`;
  output += 'These views are referenced but do not exist:\n\n';

  issues.forEach((issue, idx) => {
    const details = normalizeIssueDetails(issue);
    const missingViewId = details.targetId ?? 'unknown';

    output += `**${idx + 1}. Missing view: \`${missingViewId}\`**\n`;
    output += `  - Location: view \`${issue.viewId ?? 'unknown'}\`, element \`${issue.elementId ?? 'unknown'}\`\n`;
    output += `  - Message: ${issue.message}\n`;

    if (details.snippet) {
      output += '  - Code reference:\n';
      output += `    \`\`\`javascript\n    ${truncateSnippet(details.snippet)}\n    \`\`\`\n`;
    }

    output += `  - Suggested fix: create a view with id \`${missingViewId}\`\n\n`;
  });

  return `${output}\n`;
};

const formatEndpointIssues = (issues: ReferenceIssue[]): string => {
  if (issues.length === 0) return '';

  let output = `### API Endpoint Issues (${issues.length})\n\n`;

  const missingControllers = issues.filter(i => i.type === 'missing-endpoint');
  const missingAuthHeaders = issues.filter(i => i.type === 'missing-auth-header');
  const missingControllerAuth = issues.filter(i => i.type === 'missing-controller-auth');

  if (missingControllers.length > 0) {
    output += `#### Missing controllers (${missingControllers.length})\n\n`;
    missingControllers.forEach((issue, idx) => {
      const details = normalizeIssueDetails(issue);
      const method = details.method ?? 'UNKNOWN';
      const path = details.path ?? details.endpoint ?? 'unknown path';

      output += `**${idx + 1}. Missing endpoint: \`${method} ${path}\`**\n`;
      output += `  - Source: view \`${issue.viewId ?? 'unknown'}\`, element \`${issue.elementId ?? 'unknown'}\`\n`;
      output += `  - Message: ${issue.message}\n`;

      if (details.snippet) {
        output += '  - API call:\n';
        output += `    \`\`\`javascript\n    ${truncateSnippet(details.snippet)}\n    \`\`\`\n`;
      }

      output += `  - Suggested fix: create controller for \`${method} ${path}\` with auth() middleware\n\n`;
    });
  }

  if (missingAuthHeaders.length > 0) {
    output += `#### Critical: Missing authentication headers (${missingAuthHeaders.length})\n\n`;
    output +=
      'These API calls target protected endpoints but do not attach a Bearer token.\n\n';

    missingAuthHeaders.forEach((issue, idx) => {
      const details = normalizeIssueDetails(issue);
      const method = details.method ?? 'UNKNOWN';
      const path = details.path ?? details.endpoint ?? 'unknown path';

      output += `**${idx + 1}. Missing auth header: \`${method} ${path}\`**\n`;
      output += `  - Location: view \`${issue.viewId ?? 'unknown'}\`, element \`${issue.elementId ?? 'unknown'}\`\n`;
      output += `  - Message: ${issue.message}\n`;

      if (details.snippet) {
        output += '  - Current code:\n';
        output += `    \`\`\`javascript\n    ${truncateSnippet(details.snippet)}\n    \`\`\`\n`;
      }

      output +=
        "  - Suggested fix: add `Authorization: 'Bearer ${shortcuts.state.get(\"token\")}'` to the request headers\n\n";
    });
  }

  if (missingControllerAuth.length > 0) {
    output += `#### Controllers missing auth middleware (${missingControllerAuth.length})\n\n`;
    missingControllerAuth.forEach((issue, idx) => {
      const details = normalizeIssueDetails(issue);
      const path = details.path ?? details.endpoint ?? 'unknown path';
      const method = details.method ?? 'UNKNOWN';

      output += `**${idx + 1}. Controller missing auth(): \`${method} ${path}\`**\n`;
      output += `  - Controller: ${details.controllerName ?? issue.controllerId ?? 'unknown'}\n`;
      output += `  - Message: ${issue.message}\n`;
      output += '  - Suggested fix: add the auth middleware plugin to this controller\n\n';
    });
  }

  return `${output}\n`;
};

const formatPluginIssues = (issues: ReferenceIssue[]): string => {
  if (issues.length === 0) return '';

  let output = `### Plugin Issues (${issues.length})\n\n`;
  output += 'These plugins are referenced but not configured:\n\n';

  issues.forEach((issue, idx) => {
    const details = normalizeIssueDetails(issue);
    output += `**${idx + 1}. Missing plugin: \`${details.pluginType ?? 'unknown'}\`**\n`;
    output += `  - Plugin ID: \`${details.pluginId ?? 'unknown'}\`\n`;
    output += `  - Message: ${issue.message}\n`;
    output += '  - Suggested fix: configure the plugin in the application settings\n\n';
  });

  return `${output}\n`;
};

const formatElementIssues = (issues: ReferenceIssue[]): string => {
  if (issues.length === 0) return '';

  let output = `### Element Reference Issues (${issues.length})\n\n`;
  output += 'These element references may need attention:\n\n';

  issues.forEach((issue, idx) => {
    const details = normalizeIssueDetails(issue);
    output += `**${idx + 1}. ${issue.message}**\n`;
    output += `  - Location: view \`${issue.viewId ?? 'unknown'}\`, element \`${issue.elementId ?? 'unknown'}\`\n`;
    output += `  - Target: \`${details.targetId ?? 'N/A'}\`\n\n`;
  });

  return `${output}\n`;
};

const buildFixInstructions = (issues: ReferenceIssue[]): string => `
---

## Your Task: Generate Fix Tasks

You are now in **validation fix mode**. Create tasks to resolve every issue listed above.

### Task generation rules

1. Missing views (\`missing-navigation-target\`): create a task that builds the missing view using the exact view id.
2. Missing endpoints (\`missing-endpoint\`): create a task that defines the controller with auth() middleware.
3. Missing auth headers (\`missing-auth-header\`): add the Authorization header that reads a Bearer token from state.
4. Controllers missing auth (\`missing-controller-auth\`): add the auth middleware plugin to the controller.
5. Missing plugins (\`missing-plugin\`): configure the referenced plugin with the provided plugin id.
6. Element/reference issues: create a fix that realigns the broken reference.

Return tasks in this JSON shape:

\`\`\`json
{
  "fixTasks": [
    {
      "id": "fix-1",
      "type": "fix_auth_header",
      "priority": "critical",
      "description": "...",
      "details": { ... }
    }
  ],
  "summary": {
    "totalTasks": 1,
    "critical": 1,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
\`\`\`

Generate a task for every issue before returning your response.

`;

const buildApplicationContext = (application: any): string => {
  try {
    const truncatedApp = {
      ...application,
      views:
        application?.views
          ?.slice(0, 3)
          .map((view: any) => ({
            id: view.id,
            name: view.name,
            type: view.type,
            layoutElementCount: view.layout?.length || 0
          })) ?? [],
      controllers:
        application?.controllers
          ?.slice(0, 5)
          .map((controller: any) => ({
            id: controller.id,
            name: controller.name,
            method: controller.method,
            path: controller.path,
            hasAuth: controller.plugins?.some((p: any) => p.type === 'auth') ?? false
          })) ?? []
    };

    return `
---

## Current Application Context (partial)

\`\`\`json
${JSON.stringify(truncatedApp, null, 2)}
\`\`\`

**Note:** The full application context is available in the conversation history.

`;
  } catch (error) {
    logger.error('[ValidationFormatter] Error building application context:', error);
    return '\n---\n\n## Application Context: error serializing\n\n';
  }
};

const truncateSnippet = (snippet: string, maxLength = 200): string => {
  if (snippet.length <= maxLength) {
    return snippet;
  }
  return `${snippet.substring(0, maxLength)}... [truncated]`;
};

export const generateValidationSummary = (validation: ReferenceAnalysisResult): string => `
Validation Summary:
- Total issues: ${validation.issues.length}
- Missing navigation targets: ${validation.summary.navigation}
- Missing endpoints: ${validation.summary.endpoint}
- Missing auth headers: ${validation.summary.authHeader}
- Missing plugins: ${validation.summary.plugin}
`;
