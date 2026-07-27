import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ApiError } from '../utils/errors';

export const validateRequest = (schema?: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Basic request validation
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!req.body || Object.keys(req.body).length === 0) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Request body is required');
        }
      }

      // Validate content type for JSON requests
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Content-Type must be application/json');
        }
      }

      // Sanitize request body (basic)
      if (req.body) {
        // Remove potentially dangerous properties
        delete req.body.__proto__;
        delete req.body.constructor;

        // Limit body size (already handled by express.json limit)
        if (JSON.stringify(req.body).length > 1000000) {
          // 1MB limit
          throw new ApiError(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'Request body too large');
        }
      }

      // Validate query parameters
      if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string' && value.length > 1000) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Query parameter ${key} too long`);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const rateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const record = requests.get(ip);

      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }

      if (record.count > max) {
        throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests');
      }
    }

    next();
  };
};
