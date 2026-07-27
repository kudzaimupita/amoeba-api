// import { changePlanAndCalculatePriceDifference } from './../../../modules/company/pawstackController';
/* eslint-disable prettier/prettier */

import express, { Router } from 'express';
import {
  cancelSub,
  changePlanAndCalculatePriceDifference,
  getHistory,
  getPlans,
  processPaymentWebhook,
  subscribeUser,
  topUp,
} from '../../../modules/company/pawstackController';
import { companyController, companyValidation } from '../../../modules/company';

import { auth } from '../../../modules/auth';
import { validate } from '../../../utils/validate';

const router: Router = express.Router();
router.route('/').post(auth('create', 'company'), companyController.storeCompany);
router.post('/initiate-payment', auth('subscribe', 'billing'), subscribeUser);
router.post('/top-up', auth('subscribe', 'billing'), topUp);
router.get('/plans', getPlans);
router.get('/transactions', auth('subscribe', 'billing'), getHistory);
router.post('/change-plans', auth('subscribe', 'billing'), changePlanAndCalculatePriceDifference);
router.post('/cancel-plan', auth('subscribe', 'billing'), cancelSub);
router.post('/webhook/verify', processPaymentWebhook);
router
  .route('/:companyId')
  .get(auth('read', 'company'), validate(companyValidation.getCompany), companyController.getCompany)

  .patch(auth('update', 'company'), validate(companyValidation.updateCompany), companyController.updateCompany)
  .delete(auth('delete', 'company'), validate(companyValidation.deleteCompany), companyController.deleteCompany);

export default router;
