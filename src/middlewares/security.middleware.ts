import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { activityLogService } from '../modules/activityLogs';

// Security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles for dynamic UI
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        '*.amazonaws.com', // S3 buckets
        '*.cloudfront.net', // CloudFront CDN
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for dynamic code execution
        'https://cdn.jsdelivr.net',
      ],
      connectSrc: [
        "'self'",
        'https://api.anthropic.com', // Claude API
        'https://api.openai.com', // OpenAI API
        '*.amazonaws.com', // AWS services
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", '*.amazonaws.com'],
      frameSrc: ["'none'"],
      ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Expect-CT
  expectCt: {
    maxAge: 86400, // 24 hours
    enforce: process.env.NODE_ENV === 'production',
  },
});

// Custom security middleware for additional protection
export const additionalSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add cache control for sensitive endpoints
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// Request validation middleware
export const requestValidation = (req: Request, res: Response, next: NextFunction) => {


  // Validate request size
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(httpStatus.REQUEST_ENTITY_TOO_LARGE).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum allowed size',
      maxSize: '10MB',
    });
  }

  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');



    // Allow specific content types
    const allowedTypes = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];

    // const isAllowed = allowedTypes.some((type) => contentType.includes(type));
    // if (!isAllowed) {
    //   return res.status(httpStatus.UNSUPPORTED_MEDIA_TYPE).json({
    //     error: 'Unsupported Content-Type',
    //     message: 'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded',
    //     received: contentType,
    //   });
    // }
  }

  next();
};

// Suspicious activity detection (simplified and lenient)
export const suspiciousActivityDetection = async (req: Request, res: Response, next: NextFunction) => {
  // More lenient - only check for serious SQL injection and XSS attempts
  // Removed template syntax (${, {{) as they're legitimate in our system
  const suspiciousPatterns = [
    'union select',
    'drop table',
    'delete from',
    '<script>',
    'javascript:',
    'exec(',
    'system(',
    '../../etc/passwd',
  ];

  const checkSuspicious = (value: string): boolean => {
    return suspiciousPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
  };

  let suspiciousFound = false;
  const suspiciousItems: string[] = [];

  // Skip checking for common API endpoints that use templates
  const exemptPaths = [
    '/applications',
    '/conversations',
    '/intellisense-context',
    '/plugins',
    '/controllers',
    '/v1/applications',
    '/v1/conversations',
  ];

  const isExemptPath = exemptPaths.some((path) => req.path.includes(path));

  if (isExemptPath) {
    return next(); // Skip suspicious activity check for exempt paths
  }

  // Check URL path
  if (checkSuspicious(req.path)) {
    suspiciousFound = true;
    suspiciousItems.push(`path: ${req.path}`);
  }

  // Check query parameters (only if not exempt)
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && checkSuspicious(value)) {
      suspiciousFound = true;
      suspiciousItems.push(`query.${key}: ${value}`);
    }
  }

  // Check request body (only if not exempt and body is reasonably small)
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    // Only check if body is not too large (avoid performance issues)
    if (bodyString.length < 100000 && checkSuspicious(bodyString)) {
      suspiciousFound = true;
      suspiciousItems.push('body contains suspicious patterns');
    }
  }

  // Only log, don't block (more lenient)
  if (suspiciousFound) {
    try {
      await activityLogService.createActivityLog({
        actionBy: req.user?._id || null,
        resourceType: 'SYSTEM',
        company: req.user?.company?._id || null,
        actionType: 'SECURITY_WARNING',
        description: `Suspicious patterns detected: ${suspiciousItems.join(', ')}`,
        status: 'FAILURE',
        statusCode: httpStatus.BAD_REQUEST,
      });
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }

  next();
};

// IP whitelist/blacklist middleware
const blacklistedIPs = new Set<string>();
const whitelistedIPs = new Set<string>(['127.0.0.1', '::1', 'localhost']);

export const ipFiltering = (req: Request, res: Response, next: NextFunction) => {
  // Disable IP filtering in development mode
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  // Check if IP is blacklisted (only in production)
  if (blacklistedIPs.has(clientIP)) {
    return res.status(httpStatus.FORBIDDEN).json({
      error: 'IP blocked',
      message: 'Your IP address has been blocked',
      timestamp: new Date().toISOString(),
    });
  }

  // For admin endpoints, you might want to check whitelist (only in production)
  if (req.path.startsWith('/admin/')) {
    if (!whitelistedIPs.has(clientIP)) {
      return res.status(httpStatus.FORBIDDEN).json({
        error: 'Access denied',
        message: 'Admin access restricted to authorized IPs',
        timestamp: new Date().toISOString(),
      });
    }
  }

  next();
};

// Add IP to blacklist
export const blacklistIP = (ip: string, reason?: string) => {
  blacklistedIPs.add(ip);

  // Log the blacklisting
  activityLogService
    .createActivityLog({
      actionBy: null,
      resourceType: 'SYSTEM',
      company: null,
      actionType: 'SECURITY_WARNING',
      description: `IP ${ip} blacklisted. Reason: ${reason || 'Manual blacklist'}`,
      status: 'SUCCESS',
      statusCode: 200,
    })
    .catch((error) => {
      console.error('Failed to log IP blacklisting:', error);
    });
};

// Remove IP from blacklist
export const removeFromBlacklist = (ip: string) => {
  blacklistedIPs.delete(ip);

  activityLogService
    .createActivityLog({
      actionBy: null,
      resourceType: 'SYSTEM',
      company: null,
      actionType: 'SYSTEM_EVENT',
      description: `IP ${ip} removed from blacklist`,
      status: 'SUCCESS',
      statusCode: 200,
    })
    .catch((error) => {
      console.error('Failed to log IP unblacklisting:', error);
    });
};

// Clear all blacklisted IPs
export const clearBlacklist = () => {
  const count = blacklistedIPs.size;
  blacklistedIPs.clear();

  activityLogService
    .createActivityLog({
      actionBy: null,
      resourceType: 'SYSTEM',
      company: null,
      actionType: 'SYSTEM_EVENT',
      description: `Cleared all blacklisted IPs. ${count} IPs removed.`,
      status: 'SUCCESS',
      statusCode: 200,
    })
    .catch((error) => {
      console.error('Failed to log blacklist clearing:', error);
    });

  return { success: true, message: `${count} IPs removed from blacklist` };
};

// Get security stats
export const getSecurityStats = () => {
  return {
    blacklistedIPs: Array.from(blacklistedIPs),
    whitelistedIPs: Array.from(whitelistedIPs),
    timestamp: new Date().toISOString(),
  };
};
