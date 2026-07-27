import express, { Router } from 'express';
import passport from 'passport';

import { auth, authController, authValidation } from '../../../modules/auth';
import { validate } from '../../../utils/validate';
import { authRateLimit, passwordResetRateLimit } from '../../../middlewares/rateLimiting.middleware';

const router: Router = express.Router();

// Simple wrapper controllers for the UI components (with rate limiting)
router.post('/login', authRateLimit, validate(authValidation.requestLoginBody), authController.requestLogin);
router.post('/register', authRateLimit, validate(authValidation.requestRegisterBody), authController.requestRegister);

// Original auth routes
router.post('/request-register', validate(authValidation.requestRegisterBody), authController.requestRegister);
router.post('/confirm-register', validate(authValidation.confirmRegisterBody), authController.confirmRegister);
router.post('/refresh-token', authController.refreshTokens);
router.get('/me', auth(), authController.me);
router.post('/confirm-login', validate(authValidation.confirmLoginBody), authController.confirmLogin);
router.post('/request-login', validate(authValidation.requestLoginBody), authController.requestLogin);
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post('/reset-password', passwordResetRateLimit, validate(authValidation.resetPassword), authController.resetPassword);
router.post('/resend-request-login', validate(authValidation.resendRequestLogin), authController.resendLoginRequest);
router.post('/logout-all', authController.logoutAllSessions);

// OAuth Routes (only if strategies are configured)
const { googleStrategy, githubStrategy } = require('../../../modules/auth');

if (googleStrategy) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err.message || err);
        return res.status(500).json({ code: 500, message: 'OAuth authentication failed', error: err.message });
      }
      if (!user) {
        console.error('Google OAuth: no user returned', info);
        return res.status(401).json({ code: 401, message: 'Authentication failed', details: info?.message || 'No user' });
      }
      req.user = user;
      next();
    })(req, res, next);
  }, authController.oauthCallback);
}

if (githubStrategy) {
  router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
  router.get('/github/callback', (req, res, next) => {
    passport.authenticate('github', { session: false }, (err, user, info) => {
      if (err) {
        console.error('GitHub OAuth error:', err.message || err);
        return res.status(500).json({ code: 500, message: 'OAuth authentication failed', error: err.message });
      }
      if (!user) {
        console.error('GitHub OAuth: no user returned', info);
        return res.status(401).json({ code: 401, message: 'Authentication failed', details: info?.message || 'No user' });
      }
      req.user = user;
      next();
    })(req, res, next);
  }, authController.oauthCallback);
}

router.get('/gitlab', auth(), (_req, res) => {
  res.status(501).json({
    code: 501,
    provider: 'gitlab',
    status: 'coming_soon',
    message: 'GitLab OAuth is not available yet. Use GitHub, ZIP upload, container image, or AI generation for now.',
  });
});

router.get('/bitbucket', auth(), (_req, res) => {
  res.status(501).json({
    code: 501,
    provider: 'bitbucket',
    status: 'coming_soon',
    message: 'Bitbucket OAuth is not available yet. Use GitHub, ZIP upload, container image, or AI generation for now.',
  });
});

// Figma OAuth — service linking for MCP integration
router.get('/figma/initiate', auth(), authController.initiateFigmaOAuth);
router.get('/figma/callback', authController.figmaOAuthCallback);
router.get('/figma/status', auth(), authController.getFigmaOAuthStatus);
router.delete('/figma/disconnect', auth(), authController.disconnectFigmaOAuth);

// Claude — service linking for MCP integration
router.get('/claude/initiate', auth(), authController.initiateClaudeOAuth);
router.get('/claude/status', auth(), authController.getClaudeOAuthStatus);
router.delete('/claude/disconnect', auth(), authController.disconnectClaudeOAuth);

// Atlassian OAuth — service linking for Confluence integration
router.get('/atlassian/initiate', auth(), authController.initiateAtlassianOAuth);
router.get('/atlassian/callback', authController.atlassianOAuthCallback);
router.get('/atlassian/status', auth(), authController.getAtlassianOAuthStatus);
router.delete('/atlassian/disconnect', auth(), authController.disconnectAtlassianOAuth);

// Account linking routes
router.post('/link-oauth', auth(), validate(authValidation.linkOAuthProvider), authController.linkOAuthProvider);
router.delete(
  '/unlink-oauth/:provider',
  auth(),
  validate(authValidation.unlinkOAuthProvider),
  authController.unlinkOAuthProvider
);
router.get('/linked-providers', auth(), authController.getLinkedProviders);
router.patch('/change-password', auth(), validate(authValidation.changePassword), authController.changePassword);

export default router;
