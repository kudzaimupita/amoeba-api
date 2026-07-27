import { uniqBy } from 'lodash';

type NullableRecord = Record<string, any> | null | undefined;

type IssueCategory = 'navigation' | 'endpoint' | 'element' | 'plugin';

type IssueType =
  | 'missing-target-view'
  | 'missing-controller'
  | 'missing-element-reference'
  | 'missing-plugin-reference'
  | 'missing-auth-header';

export interface ReferenceIssue {
  category: IssueCategory;
  type: IssueType;
  message: string;
  viewId?: string;
  view?: any;
  elementId?: string;
  element?: any;
  controllerId?: string;
  controller?: any;
  targetId?: string;
  method?: string;
  path?: string;
  pluginId?: string;
  pluginType?: string;
  snippet?: string;
  source?: string;
}

export interface ReferenceAnalysisResult {
  issues: ReferenceIssue[];
  views: Array<{
    viewId: string;
    view: any;
    issues: ReferenceIssue[];
  }>;
  controllers: Array<{
    controllerId: string;
    controller: any;
    issues: ReferenceIssue[];
  }>;
  summary: {
    missingNavigationTargets: number;
    missingEndpoints: number;
    missingElementReferences: number;
    missingPlugins: number;
    missingAuthHeaders: number;
  };
}

export interface ReferenceIssueDetailContext {
  targetLabel?: string;
  targetId?: string | null;
  secondaryText?: string;
}

export const formatReferenceIssueDetails = (
  issue: ReferenceIssue,
  context: ReferenceIssueDetailContext = {}
): string => {
  const parts: string[] = [`Issue Type: ${issue.type}`];
  const { targetLabel, targetId, secondaryText } = context;

  if (targetLabel || targetId || issue.viewId || issue.elementId) {
    const label = targetLabel || issue.view?.name || issue.element?.name || issue.viewId || issue.elementId;
    const id =
      targetId != null
        ? targetId
        : issue.elementId
        ? issue.elementId
        : issue.viewId
        ? issue.viewId
        : null;
    parts.push(`Target: ${label}${id ? ` (${id})` : ''}`);
  }

  if (issue.message) {
    parts.push(`Message: ${issue.message}`);
  }

  if (secondaryText) {
    parts.push(`Details: ${secondaryText}`);
  }

  if (issue.method && issue.path) {
    parts.push(`Request: ${issue.method} ${issue.path}`);
  }

  if (issue.pluginType) {
    parts.push(`Plugin: ${issue.pluginType}`);
  }

  if (issue.source) {
    parts.push(`Source: ${issue.source}`);
  }

  if (issue.snippet) {
    parts.push(`Snippet:\n${issue.snippet}`);
  }

  return parts.filter(Boolean).join('\n\n');
};

export const describeReferenceIssueType = (type: ReferenceIssue['type']): string => {
  if (!type) return 'Issue';
  return type
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

interface ScanContext {
  viewId?: string;
  view?: any;
  elementId?: string;
  element?: any;
  controllerId?: string;
  controller?: any;
  source: string;
}

const KNOWN_PLUGIN_PREFIXES = [
  'mongo',
  'db',
  'auth',
  'drive',
  'storage',
  'smtp',
  'mailer',
  'mail',
  'kv',
  'cache',
  'redis',
  'search',
  'queue',
  'billing',
  'ai',
  'llm',
  'stripe',
  'payments',
  'analytics',
];

const AUTH_EXEMPT_KEYWORDS = [
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'forgot',
  'forgot-password',
  'forgotpassword',
  'reset',
  'reset-password',
  'resetpassword',
];

const EVENT_HANDLERS = [
  'onClick',
  'onChange',
  'onSubmit',
  'onMount',
  'onFocus',
  'onBlur',
  'onDragOver',
  'onDragLeave',
  'onDrop',
  'onLoad',
  'onSuccess',
  'onError',
  'onSelect',
  'onInput',
];

const normalizeKey = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const toControllerKey = (method: string, path: string) => `${method.toUpperCase()} ${path.trim()}`;

const getCanonicalPluginId = (plugin: any): string | null => {
  if (!plugin) return null;
  return (
    plugin?._id ||
    plugin?.id ||
    plugin?.configId ||
    plugin?.pluginId ||
    plugin?.plugin_id ||
    plugin?.config?.id ||
    null
  )
    ? String(
        plugin?._id ||
          plugin?.id ||
          plugin?.configId ||
          plugin?.pluginId ||
          plugin?.plugin_id ||
          plugin?.config?.id
      )
    : null;
};

const collectExecuteCodeSnippets = (container: NullableRecord): string[] => {
  if (!container || typeof container !== 'object') {
    return [];
  }

  const plugins = Array.isArray((container as any).plugins) ? (container as any).plugins : [];

  return plugins
    .filter((plugin: any) => plugin?.type === 'executeCode' && typeof plugin.code === 'string')
    .map((plugin: any) => plugin.code as string);
};

const collectAllExecuteCodeSnippets = (config: NullableRecord): string[] => {
  if (!config || typeof config !== 'object') {
    return [];
  }

  const snippets: string[] = [];

  if (Array.isArray((config as any)._overrides_)) {
    (config as any)._overrides_.forEach((override: any) => {
      snippets.push(...collectExecuteCodeSnippets(override));
    });
  }

  EVENT_HANDLERS.forEach((handlerName) => {
    const handler = (config as any)[handlerName];
    if (handler && typeof handler === 'object') {
      snippets.push(...collectExecuteCodeSnippets(handler));
    }
  });

  if (typeof (config as any).code === 'string') {
    snippets.push((config as any).code);
  }
  if (typeof (config as any).script === 'string') {
    snippets.push((config as any).script);
  }

  return snippets;
};

export const analyzeReferenceDiagnostics = (
  currentApplication: any,
  plugins: any[] = []
): ReferenceAnalysisResult => {
  const views = Array.isArray(currentApplication?.views) ? currentApplication.views : [];
  const controllers = Array.isArray(currentApplication?.controllers) ? currentApplication.controllers : [];

  const allPluginSources = uniqBy(
    [
      ...(Array.isArray(currentApplication?.plugins) ? currentApplication.plugins : []),
      ...plugins,
    ],
    (plugin) => getCanonicalPluginId(plugin) || Math.random().toString(36)
  );

  const controllerLookup = new Map<string, any>();
  const controllerById = new Map<string, any>();
  controllers.forEach((controller: any) => {
    if (!controller) {
      return;
    }
    const method = String(controller?.method || 'GET').toUpperCase();
    const path = String(controller?.path || '').trim();
    if (path) {
      controllerLookup.set(toControllerKey(method, path), controller);
    }
    const controllerId = controller?.id || controller?._id;
    if (controllerId) {
      controllerById.set(String(controllerId), controller);
    }
  });

  const pluginInfoMap = new Map<string, any>();
  allPluginSources.forEach((plugin) => {
    const pluginId = getCanonicalPluginId(plugin);
    if (pluginId) {
      pluginInfoMap.set(pluginId, plugin);
    }
  });

  const viewIdentifierMap = new Map<string, string>();
  const viewById = new Map<string, any>();
  const elementLookup = new Map<
    string,
    { viewId: string; elementId: string; element: any }
  >();

  views.forEach((view: any) => {
    const canonicalViewId = view?.id || view?._id;
    if (!canonicalViewId) return;

    viewById.set(canonicalViewId, view);

    const identifiers = [
      canonicalViewId,
      view?.viewId,
      view?.slug,
      view?.name,
      view?.label,
      view?.configuration?.viewId,
    ];

    identifiers.forEach((identifier) => {
      const normalized = normalizeKey(identifier);
      if (normalized) {
        viewIdentifierMap.set(normalized, canonicalViewId);
      }
    });

    const layoutElements = Array.isArray(view?.layout) ? view.layout : [];
    layoutElements.forEach((element: any) => {
      const elementId = element?.id || element?.elementId || element?.i;
      const normalizedElementId = normalizeKey(elementId);
      if (normalizedElementId) {
        elementLookup.set(normalizedElementId, {
          viewId: canonicalViewId,
          elementId: elementId ?? normalizedElementId,
          element,
        });
      }
    });
  });

  const issues: ReferenceIssue[] = [];
  const uniqueIssueKeys = new Set<string>();

  const issuesByView = new Map<
    string,
    {
      view: any;
      issues: ReferenceIssue[];
    }
  >();

  const issuesByController = new Map<
    string,
    {
      controller: any;
      issues: ReferenceIssue[];
    }
  >();

  const recordIssue = (issue: ReferenceIssue) => {
    const keyParts = [
      issue.category,
      issue.type,
      issue.viewId ?? '',
      issue.elementId ?? '',
      issue.controllerId ?? '',
      issue.targetId ?? '',
      issue.method ?? '',
      issue.path ?? '',
      issue.pluginId ?? '',
      issue.pluginType ?? '',
    ];
    const cacheKey = keyParts.join('|');
    if (uniqueIssueKeys.has(cacheKey)) return;
    uniqueIssueKeys.add(cacheKey);

    issues.push(issue);

    if (issue.viewId) {
      const bucket =
        issuesByView.get(issue.viewId) ||
        (() => {
          const next = {
            view: issue.view ?? viewById.get(issue.viewId),
            issues: [] as ReferenceIssue[],
          };
          issuesByView.set(issue.viewId!, next);
          return next;
        })();
      bucket.issues.push(issue);
    }

    if (issue.controllerId) {
      const bucket =
        issuesByController.get(issue.controllerId) ||
        (() => {
          const next = {
            controller: issue.controller ?? controllerById.get(issue.controllerId!),
            issues: [] as ReferenceIssue[],
          };
          issuesByController.set(issue.controllerId!, next);
          return next;
        })();
      bucket.issues.push(issue);
    }
  };

  const handleMissingViewReference = (
    targetId: string,
    context: ScanContext,
    snippet?: string
  ) => {
    recordIssue({
      category: 'navigation',
      type: 'missing-target-view',
      message: `Reference to view '${targetId}' could not be resolved`,
      viewId: context.viewId,
      view: context.view,
      elementId: context.elementId,
      element: context.element,
      controllerId: context.controllerId,
      controller: context.controller,
      targetId,
      snippet,
      source: context.source,
    });
  };

  const handleMissingEndpoint = (
    method: string,
    path: string,
    context: ScanContext,
    snippet?: string
  ) => {
    recordIssue({
      category: 'endpoint',
      type: 'missing-controller',
      message: `HTTP ${method} ${path} has no matching controller`,
      viewId: context.viewId,
      view: context.view,
      elementId: context.elementId,
      element: context.element,
      controllerId: context.controllerId,
      controller: context.controller,
      method,
      path,
      snippet,
      source: context.source,
    });
  };

  const handleMissingReference = (
    reference: string,
    context: ScanContext,
    relation: string
  ) => {
    recordIssue({
      category: 'element',
      type: 'missing-element-reference',
      message: `Reference '${reference}' could not be matched to an existing view or element (${relation})`,
      viewId: context.viewId,
      view: context.view,
      elementId: context.elementId,
      element: context.element,
      controllerId: context.controllerId,
      controller: context.controller,
      targetId: reference,
      source: context.source,
    });
  };

  const handleMissingPlugin = (
    pluginType: string,
    pluginId: string,
    context: ScanContext,
    snippet?: string
  ) => {
    recordIssue({
      category: 'plugin',
      type: 'missing-plugin-reference',
      message: `Plugin '${pluginType}' with id '${pluginId}' is not available`,
      viewId: context.viewId,
      view: context.view,
      elementId: context.elementId,
      element: context.element,
      controllerId: context.controllerId,
      controller: context.controller,
      pluginId,
      pluginType,
      snippet,
      source: context.source,
    });
  };

  const handleMissingAuthHeader = (
    method: string,
    path: string,
    context: ScanContext,
    snippet?: string
  ) => {
    recordIssue({
      category: 'endpoint',
      type: 'missing-auth-header',
      message: `HTTP ${method} ${path} is secured by auth plugin but request is missing Bearer token`,
      viewId: context.viewId,
      view: context.view,
      elementId: context.elementId,
      element: context.element,
      controllerId: context.controllerId,
      controller: context.controller,
      method,
      path,
      snippet,
      source: context.source,
    });
  };

  const endpointReferenceSet = new Set<string>();
  const navigationReferenceSet = new Set<string>();
  const elementReferenceSet = new Set<string>();
  const pluginReferenceSet = new Set<string>();
  const authControllerIds = new Set<string>();
  const endpointUsageMeta = new Map<
    string,
    Array<{ viewId: string; method: string; path: string; snippet?: string; hasAuthHeader: boolean | null }>
  >();

  const validateNavigationTarget = (
    targetRaw: string,
    context: ScanContext,
    snippet?: string
  ) => {
    const normalizedTarget = normalizeKey(targetRaw);
    if (!normalizedTarget) return;

    const canonicalViewId = viewIdentifierMap.get(normalizedTarget);

    const key = `${context.viewId || context.controllerId || 'global'}|${normalizedTarget}`;
    if (navigationReferenceSet.has(key)) {
      return;
    }
    navigationReferenceSet.add(key);

    if (!canonicalViewId) {
      handleMissingViewReference(targetRaw, context, snippet);
    }
  };

  const validateEndpointReference = (
    methodRaw: string,
    pathRaw: string,
    context: ScanContext,
    snippet?: string
  ) => {
    if (!methodRaw || !pathRaw) return;
    const method = String(methodRaw).toUpperCase();
    const normalizedPath = String(pathRaw).trim();
    if (!method || !normalizedPath) return;

    const cacheKey = `${context.viewId || context.controllerId || 'global'}|${method}|${normalizedPath}`;
    const wasSeen = endpointReferenceSet.has(cacheKey);
    if (!wasSeen) {
      endpointReferenceSet.add(cacheKey);
    }

    const controller = controllerLookup.get(toControllerKey(method, normalizedPath));

    if (context.viewId && controller) {
      const controllerIdValue = controller?.id || controller?._id;
      const controllerId = controllerIdValue != null ? String(controllerIdValue) : null;
      if (controllerId) {
        const viewId = String(context.viewId);
        const snippetLower = snippet ? snippet.toLowerCase() : '';
        const hasAuthHeader =
          snippet != null
            ? snippetLower.includes('authorization') && snippetLower.includes('bearer')
            : null;
        const existing = endpointUsageMeta.get(controllerId) ?? [];
        const isDuplicate = existing.some(
          (entry) =>
            entry.viewId === viewId &&
            entry.method === method &&
            entry.path === normalizedPath &&
            entry.snippet === snippet
        );
        if (!isDuplicate) {
          existing.push({
            viewId,
            method,
            path: normalizedPath,
            snippet,
            hasAuthHeader,
          });
          endpointUsageMeta.set(controllerId, existing);
        } else if (hasAuthHeader === true) {
          const targetEntry = existing.find(
            (entry) =>
              entry.viewId === viewId &&
              entry.method === method &&
              entry.path === normalizedPath &&
              entry.snippet === snippet
          );
          if (targetEntry && targetEntry.hasAuthHeader !== true) {
            targetEntry.hasAuthHeader = true;
          }
        }
      }
    }

    if (!controller) {
      if (!wasSeen) {
        handleMissingEndpoint(method, normalizedPath, context, snippet);
      }
      return;
    }
  };

  const validateElementReference = (
    referenceRaw: string,
    context: ScanContext,
    relation: string
  ) => {
    const normalizedRef = normalizeKey(referenceRaw);
    if (!normalizedRef) return;

    const cacheKey = `${context.viewId || context.controllerId || 'global'}|${normalizedRef}|${relation}`;
    if (elementReferenceSet.has(cacheKey)) {
      return;
    }
    elementReferenceSet.add(cacheKey);

    if (viewIdentifierMap.has(normalizedRef) || elementLookup.has(normalizedRef)) {
      return;
    }

    handleMissingReference(referenceRaw, context, relation);
  };

  const validatePluginReference = (
    pluginTypeRaw: string,
    pluginIdRaw: string,
    context: ScanContext,
    snippet?: string
  ) => {
    const pluginType = pluginTypeRaw?.trim();
    const pluginId = pluginIdRaw?.trim();
    if (!pluginType || !pluginId) return;

    if (context.controllerId && pluginType.toLowerCase().startsWith('auth')) {
      authControllerIds.add(String(context.controllerId));
    }

    const cacheKey = `${context.viewId || context.controllerId || 'global'}|${pluginType}|${pluginId}`;
    if (pluginReferenceSet.has(cacheKey)) {
      return;
    }
    pluginReferenceSet.add(cacheKey);

    if (!pluginInfoMap.has(pluginId)) {
      handleMissingPlugin(pluginType, pluginId, context, snippet);
    }
  };

  const scanCodeForIssues = (code: string, context: ScanContext) => {
    if (typeof code !== 'string' || !code.trim()) {
      return;
    }

    const codeStr = String(code);

    const simpleNavPattern =
      /(?:shortcuts\.)?navigateToView\s*\(\s*['"`]([a-f0-9]{24}|[\w-]+)['"`]\s*\)/gi;
    let navMatch: RegExpExecArray | null;
    while ((navMatch = simpleNavPattern.exec(codeStr)) !== null) {
      validateNavigationTarget(navMatch[1], context, navMatch[0]);
    }

    const arrowFunctionNavPattern =
      /\(\s*\)\s*=>\s*(?:shortcuts\.)?navigateToView\s*\(\s*['"`]([a-f0-9]{24}|[\w-]+)['"`]\s*\)/gi;
    let arrowNavMatch: RegExpExecArray | null;
    while ((arrowNavMatch = arrowFunctionNavPattern.exec(codeStr)) !== null) {
      validateNavigationTarget(arrowNavMatch[1], context, arrowNavMatch[0]);
    }

    const httpPattern =
      /shortcuts\.http\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let httpMatch: RegExpExecArray | null;
    while ((httpMatch = httpPattern.exec(codeStr)) !== null) {
      validateEndpointReference(httpMatch[1], httpMatch[2], context, httpMatch[0]);
    }

    const httpNoShortcutPattern =
      /\bhttp\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let httpNoShortcutMatch: RegExpExecArray | null;
    while ((httpNoShortcutMatch = httpNoShortcutPattern.exec(codeStr)) !== null) {
      validateEndpointReference(
        httpNoShortcutMatch[1],
        httpNoShortcutMatch[2],
        context,
        httpNoShortcutMatch[0]
      );
    }

    const httpTemplatePattern =
      /shortcuts\.http\.(get|post|put|patch|delete|head|options)\s*\(\s*`([^`]+)`/gi;
    let httpTemplateMatch: RegExpExecArray | null;
    while ((httpTemplateMatch = httpTemplatePattern.exec(codeStr)) !== null) {
      if (!httpTemplateMatch[2]?.includes('${')) {
        validateEndpointReference(httpTemplateMatch[1], httpTemplateMatch[2], context, httpTemplateMatch[0]);
      }
    }

    const dynamicListPattern = /shortcuts\.renderDynamicList\s*\(\s*\{([\s\S]*?)\}\s*\)/gi;
    let dynamicListMatch: RegExpExecArray | null;
    while ((dynamicListMatch = dynamicListPattern.exec(codeStr)) !== null) {
      const configBlock = dynamicListMatch[1];
      const blueprintMatch = /blueprint\s*:\s*['"`]([^'"`]+)['"`]/i.exec(configBlock);
      if (!blueprintMatch) continue;

      validateElementReference(blueprintMatch[1], context, 'dynamicList.blueprint');
    }

    const normalizedCode = codeStr.replace(/\s+/g, ' ');
    const setPluginsPattern = /setPlugins\s*\(\s*\{([^}]*(?:\}[^}]*)*?)\}\s*\)/gi;
    let setPluginsMatch: RegExpExecArray | null;
    while ((setPluginsMatch = setPluginsPattern.exec(normalizedCode)) !== null) {
      const pluginsObjectContent = setPluginsMatch[1];
      const pluginPattern = /(\w+)\s*:\s*['"`]([a-f0-9]{24})['"`]/gi;
      let pluginMatch: RegExpExecArray | null;

      while ((pluginMatch = pluginPattern.exec(pluginsObjectContent)) !== null) {
        const pluginType = pluginMatch[1];
        const pluginId = pluginMatch[2];

        if (
          KNOWN_PLUGIN_PREFIXES.some((prefix) => pluginType.toLowerCase().startsWith(prefix)) ||
          pluginInfoMap.has(pluginId)
        ) {
          validatePluginReference(pluginType, pluginId, context, pluginMatch[0]);
        }
      }
    }

    const directPluginPattern =
      /\b(mongo|auth|drive|smtp|mailer|db|storage|queue|kv|redis|cache|search|ai|llm|stripe)\s*:\s*['"`]([a-f0-9]{24})['"`]/gi;
    let directPluginMatch: RegExpExecArray | null;
    while ((directPluginMatch = directPluginPattern.exec(codeStr)) !== null) {
      validatePluginReference(directPluginMatch[1], directPluginMatch[2], context, directPluginMatch[0]);
    }
  };

  views.forEach((view: any) => {
    const viewId = view?.id || view?._id;
    if (!viewId) return;
    const normalizedViewId = normalizeKey(viewId);

    const layoutElements = Array.isArray(view?.layout) ? view.layout : [];
    const elementIdsInView = new Set<string>();
    layoutElements.forEach((element: any) => {
      const elementId = element?.id || element?.elementId || element?.i;
      const normalizedElementId = normalizeKey(elementId);
      if (normalizedElementId) {
        elementIdsInView.add(normalizedElementId);
      }
    });

    const viewContextBase: ScanContext = {
      viewId,
      view,
      source: 'view',
    };

    layoutElements.forEach((element: any) => {
      const elementId = element?.id || element?.elementId || element?.i;
      const elementContext: ScanContext = {
        ...viewContextBase,
        elementId: elementId ?? undefined,
        element,
      };

      const config = element?.configuration || {};

      const endpointValue = config.apiEndpoint || config.endpoint || config.url;
      if (typeof endpointValue === 'string') {
        const match = endpointValue.match(/^(?:(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+)?(.+)$/i);
        if (match) {
          const method = match[1] || 'GET';
          const path = match[2];
          validateEndpointReference(method, path, elementContext);
        }
      }

      if (config?.dataSource?.endpoint) {
        const ds = config.dataSource;
        const method = ds.method || 'GET';
        const path = ds.endpoint;
        validateEndpointReference(method, path, elementContext);
      }

      const referenceCandidates = [
        element?.parent,
        element?.parentView,
        element?.parentViewId,
        config?.parentView,
        config?.parentViewId,
        config?.viewId,
        config?.blueprint,
        element?.componentId,
        config?.componentId,
      ];

      referenceCandidates
        .map((candidate) => ({
          normalized: normalizeKey(candidate),
          raw: candidate,
        }))
        .filter(
          (candidate) =>
            candidate.normalized &&
            candidate.normalized !== normalizedViewId &&
            !elementIdsInView.has(candidate.normalized!)
        )
        .forEach((candidate) => {
          if (candidate.raw) {
            validateElementReference(candidate.raw as string, elementContext, 'element.configuration');
          }
        });

      const snippets = collectAllExecuteCodeSnippets(config);
      snippets.forEach((snippet) => {
        scanCodeForIssues(snippet, {
          ...elementContext,
          source: 'element.executeCode',
        });
      });
    });
  });

  controllers.forEach((controller: any) => {
    if (!controller) return;
    const controllerIdValue = controller?.id || controller?._id;
    const controllerId = controllerIdValue != null ? String(controllerIdValue) : null;
    if (!controllerId) return;

    const usages = endpointUsageMeta.get(controllerId) ?? [];

    if (authControllerIds.has(controllerId)) {
      const controllerPathLower = (controller.path || '').toLowerCase();
      const isAuthExempt = AUTH_EXEMPT_KEYWORDS.some((keyword) => controllerPathLower.includes(keyword));
      if (isAuthExempt) {
        return;
      }

      usages.forEach((usage) => {
        if (!usage.viewId) return;
        const key = `${usage.viewId}|${usage.method}|${usage.path}`;
        if (usage.hasAuthHeader === false || usage.hasAuthHeader === null) {
          const context: ScanContext = {
            viewId: usage.viewId,
            source: 'controller.auth-validation',
          };
          handleMissingAuthHeader(usage.method, usage.path, context, usage.snippet);
        }
      });
    }
  });

  const filteredIssues = issues.filter((issue) => issue.type !== 'missing-element-reference');

  const summary = {
    missingNavigationTargets: filteredIssues.filter((i) => i.type === 'missing-target-view').length,
    missingEndpoints: filteredIssues.filter((i) => i.type === 'missing-controller').length,
    missingElementReferences: issues.filter((i) => i.type === 'missing-element-reference').length,
    missingPlugins: filteredIssues.filter((i) => i.type === 'missing-plugin-reference').length,
    missingAuthHeaders: filteredIssues.filter((i) => i.type === 'missing-auth-header').length,
  };

  const viewsResult = Array.from(issuesByView.entries())
    .map(([viewId, bucket]) => {
      const filtered = bucket.issues.filter((issue) => issue.type !== 'missing-element-reference');
      if (filtered.length === 0) return null;
      return {
        viewId,
        view: bucket.view,
        issues: filtered,
      };
    })
    .filter(Boolean) as Array<{
      viewId: string;
      view: any;
      issues: ReferenceIssue[];
    }>;

  const controllersResult = Array.from(issuesByController.entries())
    .map(([controllerId, bucket]) => {
      const filtered = bucket.issues.filter((issue) => issue.type !== 'missing-element-reference');
      if (filtered.length === 0) return null;
      return {
        controllerId,
        controller: bucket.controller,
        issues: filtered,
      };
    })
    .filter(Boolean) as Array<{
      controllerId: string;
      controller: any;
      issues: ReferenceIssue[];
    }>;

  return {
    issues: filteredIssues,
    views: viewsResult,
    controllers: controllersResult,
    summary,
  };
};
