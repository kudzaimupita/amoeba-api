import express from 'express';
import { betaUserController } from '../../modules/betaUsers/betaUser.controller';

const router = express.Router();

// Get waitlist with pagination and filters
router.post('/get-waitlist', betaUserController.getWaitlist);

// Get whitelisted users
router.post('/get-whitelisted', betaUserController.getWhitelistedUsers);

// Get waitlist statistics
router.post('/stats', betaUserController.getWaitlistStats);

// Whitelist a user
router.post('/whitelist/:email', betaUserController.whitelistUser);

// Remove user from whitelist
router.post('/remove-whitelist/:email', betaUserController.removeFromWhitelist);

// Delete user from waitlist/whitelist
router.post('/delete/:email', betaUserController.deleteUser);

// Check whitelist status (can be used by frontend)
router.post('/check-status/:email', betaUserController.checkWhitelistStatus);

export default router;
