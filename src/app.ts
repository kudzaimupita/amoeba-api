import express, { Express, Request, Response } from 'express';
import compression from 'compression';
import cors from 'cors';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import httpStatus from 'http-status';
import passport from 'passport';
import xss from 'xss-clean';

import adminRoutes from './adminApp/routes/index';
import config from './config/config';
import routes from './clientApp/routes/v1';
import { jwtStrategy, googleStrategy, githubStrategy } from './modules/auth';
import { sessionTrackerRoutes } from './modules/sessions';
import {
  burstProtection,
  generalRateLimit,
} from './middlewares/rateLimiting.middleware';
import {
  additionalSecurity,
  ipFiltering,
  requestValidation,
  securityHeaders,
  suspiciousActivityDetection,
} from './middlewares/security.middleware';
import { authLimiter } from './utils';
import { ApiError, errorConverter, errorHandler } from './utils/errors';
import { morgan } from './utils/logger';

const app: Express = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(ipFiltering);
app.use(securityHeaders);
app.use(additionalSecurity);
app.use(requestValidation);
app.use(suspiciousActivityDetection);
app.use(burstProtection);
app.use(generalRateLimit);

app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(ExpressMongoSanitize());

app.use(compression());
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

if (googleStrategy) {
  passport.use('google', googleStrategy);
}
if (githubStrategy) {
  passport.use('github', githubStrategy);
}

if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.use('/v1', routes);
app.use('/api/v1', routes);
app.use('/v1/admin', adminRoutes);
app.use('/v1', sessionTrackerRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use(errorConverter);
app.use(errorHandler);

export { app };
