/* eslint-disable prettier/prettier */

import express, { Router } from 'express';

import { auth } from '../../../modules/auth';
import { betaUserController } from '../../../modules/betaUsers/betaUser.controller';
import { betaUserValidation } from '../../../modules/betaUsers/betaUser.validation';
import { validate } from '../../../utils/validate';

const router: Router = express.Router();

// Public routes (no auth required)
router.post('/join-waitlist', validate(betaUserValidation.createBetaUser), betaUserController.addToWaitlist);
router.post('/check-status/:email', betaUserController.checkWhitelistStatus);

// Protected routes (admin only)
router
  .route('/')
  .post(validate(betaUserValidation.createBetaUser), betaUserController.createBetaUser)
  .get(auth('readList', 'betaUser'), validate(betaUserValidation.getBetaUsers), betaUserController.getBetaUsers);

router.get('/waitlist', auth('readList', 'betaUser'), betaUserController.getWaitlist);
router.get('/whitelisted', auth('readList', 'betaUser'), betaUserController.getWhitelistedUsers);
router.get('/stats', auth('readList', 'betaUser'), betaUserController.getWaitlistStats);

router.post('/whitelist/:email', auth('update', 'betaUser'), betaUserController.whitelistUser);
router.post('/remove-whitelist/:email', auth('update', 'betaUser'), betaUserController.removeFromWhitelist);
router.delete('/:email', auth('delete', 'betaUser'), betaUserController.deleteUser);

// Test endpoint (can be removed in production)
router.post('/test-early-access-email', auth('update', 'betaUser'), betaUserController.testEarlyAccessEmail);

export default router;
