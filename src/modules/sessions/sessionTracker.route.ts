import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SessionTrackerController } from './sessionTracker.controller';
import { auth } from '../auth';

const router = Router();
const controller = new SessionTrackerController();

const trackingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many tracking requests, please try again later',
});

// Public endpoints (no auth required)
router.get('/tracking/session/by-ip', trackingRateLimiter, controller.getOrCreateSessionByIp);
router.post('/tracking/start', trackingRateLimiter, controller.startSession);
router.post('/tracking/event', trackingRateLimiter, controller.recordEvent);

// Data backup endpoints (public for form persistence)
router.post('/tracking/backup', trackingRateLimiter, controller.saveDataBackup);
router.get('/tracking/backup/:sessionId', trackingRateLimiter, controller.getDataBackup);
router.delete('/tracking/backup/:sessionId', trackingRateLimiter, controller.clearDataBackup);

// Public analytics endpoints (making these public for landing pages)
router.get('/tracking/session/:sessionId', trackingRateLimiter, controller.getSession);

// Protected analytics endpoints (keep these protected for admin use)
router.get('/tracking/user/:anonymousId', auth(), controller.getUserSessions);
router.get('/tracking/ip/:ipAddress?', auth(), controller.getUserSessionsByIp);
router.get('/tracking/analytics/dwell', auth(), controller.getDwellAnalytics);

export default router;
