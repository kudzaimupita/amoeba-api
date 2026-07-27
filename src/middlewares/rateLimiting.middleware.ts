import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { activityLogService } from '../modules/activityLogs';

// Store for tracking violations
const violationStore = new Map<string, { count: number; lastViolation: Date }>();

// Helper to log rate limit violations
const logRateLimitViolation = async (req: Request, type: string) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  try {
    await activityLogService.createActivityLog({
      actionBy: req.user?._id || null,
      resourceType: 'SYSTEM',
      company: req.user?.company?._id || null,
      actionType: 'SECURITY_WARNING',
      description: `${type} rate limit exceeded from IP: ${ip}, User-Agent: ${userAgent}`,
      status: 'FAILURE',
      statusCode: httpStatus.TOO_MANY_REQUESTS,
    });
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }

  // Track violations for potential IP blocking
  const key = `${ip}:${type}`;
  const existing = violationStore.get(key);
  if (existing) {
    existing.count++;
    existing.lastViolation = new Date();
  } else {
    violationStore.set(key, { count: 1, lastViolation: new Date() });
  }
};

// Custom rate limit response
const rateLimitResponse = (type: string) => (req: Request, res: Response) => {
  logRateLimitViolation(req, type);

  res.status(httpStatus.TOO_MANY_REQUESTS).json({
    error: 'Rate limit exceeded',
    message: `Too many ${type} requests. Please try again later.`,
    type: 'RATE_LIMIT_ERROR',
    retryAfter: res.get('Retry-After'),
    timestamp: new Date().toISOString(),
  });
};

// General API rate limiting (5000 requests per 15 minutes)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased from 2000
  message: 'Too many requests from this IP, please try again later',
  handler: rateLimitResponse('general'),
  skip: (req) => {
    // Skip rate limiting for health checks and common read operations
    const exemptPaths = [
      '/health',
      '/api/health',
      '/v1/applications', // Application listings
      '/v1/plugins', // Plugin listings
      '/v1/auth/me', // User profile checks
      '/v1/deployments', // Deployment status polling
      '/v1/api/conversations', // Conversation polling
      '/v1/comments', // Comments API
      '/v1/views', // Views API
      '/v1/environments', // Environments API
    ];

    // Skip for all GET requests to common read operations
    if (
      req.method === 'GET' &&
      (req.path.startsWith('/v1/applications') ||
        req.path.startsWith('/v1/plugins') ||
        req.path.startsWith('/v1/auth/me') ||
        req.path.startsWith('/v1/deployments') ||
        req.path.startsWith('/v1/api/conversations') ||
        req.path.startsWith('/v1/comments') ||
        req.path.startsWith('/v1/views') ||
        req.path.startsWith('/v1/environments'))
    ) {
      return true;
    }

    // Skip ALL OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return true;
    }

    // Skip HEAD requests (health checks)
    if (req.method === 'HEAD') {
      return true;
    }

    return exemptPaths.some((path) => req.path === path || req.path.startsWith(path));
  },
});

// Strict rate limiting for authentication endpoints (50 attempts per 15 minutes)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 20 for development
  message: 'Too many authentication attempts, please try again later',
  handler: rateLimitResponse('authentication'),
  keyGenerator: (req) => {
    // Use both IP and email for auth rate limiting
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  },
});

// Password reset rate limiting (3 attempts per hour)
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later',
  handler: rateLimitResponse('password-reset'),
  keyGenerator: (req) => {
    // Use email for password reset rate limiting
    const email = req.body?.email || req.ip;
    return `password-reset:${email}`;
  },
});

// File upload rate limiting (10 uploads per hour)
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads, please try again later',
  handler: rateLimitResponse('file-upload'),
});

// API creation rate limiting (200 requests per hour for resource creation)
export const creationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Too many creation requests, please try again later',
  handler: rateLimitResponse('creation'),
});

// Deployment rate limiting (5 deployments per hour)
export const deploymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many deployment requests, please try again later',
  handler: rateLimitResponse('deployment'),
});

// Burst protection - reasonable short-term limiting
export const burstProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Increased from 100 requests per minute for development
  message: 'Request burst detected, please slow down',
  handler: rateLimitResponse('burst-protection'),
  skip: (req) => {
    // Skip OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return true;
    }

    // Skip HEAD requests (health checks)
    if (req.method === 'HEAD') {
      return true;
    }

    // Skip health check endpoints
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }

    return false;
  },
});

// IP-based blocking for repeated violations
export const checkViolationHistory = (req: Request, res: Response, next: Function) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Check if IP has too many violations
  let totalViolations = 0;
  const recentViolations = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

  for (const [key, violation] of violationStore.entries()) {
    if (key.startsWith(ip) && violation.lastViolation > recentViolations) {
      totalViolations += violation.count;
    }
  }

  // Block IP if too many violations (more than 50 violations in 24 hours)
  if (totalViolations > 50) {
    logRateLimitViolation(req, 'ip-blocked');
    return res.status(httpStatus.FORBIDDEN).json({
      error: 'IP blocked',
      message: 'Your IP has been temporarily blocked due to repeated violations',
      type: 'IP_BLOCKED',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// Clean up old violation records (run periodically)
export const cleanupViolationStore = () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  for (const [key, violation] of violationStore.entries()) {
    if (violation.lastViolation < cutoff) {
      violationStore.delete(key);
    }
  }
};

// Start cleanup interval
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupViolationStore, 60 * 60 * 1000); // Clean up every hour
}

// Export violation store for monitoring
export const getViolationStats = () => {
  const stats = {
    totalEntries: violationStore.size,
    recentViolations: 0,
    topViolators: [] as Array<{ ip: string; violations: number; lastViolation: Date }>,
  };

  const recent = new Date(Date.now() - 60 * 60 * 1000); // Last hour
  const violatorMap = new Map<string, { violations: number; lastViolation: Date }>();

  for (const [key, violation] of violationStore.entries()) {
    if (violation.lastViolation > recent) {
      stats.recentViolations++;
    }

    const ip = key.split(':')[0];
    const existing = violatorMap.get(ip);
    if (existing) {
      existing.violations += violation.count;
      if (violation.lastViolation > existing.lastViolation) {
        existing.lastViolation = violation.lastViolation;
      }
    } else {
      violatorMap.set(ip, {
        violations: violation.count,
        lastViolation: violation.lastViolation,
      });
    }
  }

  // Get top 10 violators
  stats.topViolators = Array.from(violatorMap.entries())
    .map(([ip, data]) => ({ ip, ...data }))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 10);

  return stats;
};
