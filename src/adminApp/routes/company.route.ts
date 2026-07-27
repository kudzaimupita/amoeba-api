/* eslint-disable prettier/prettier */

import express, { Router } from 'express';
import { companyController, companyValidation } from '../../modules/company';

import { auth } from '../../modules/auth';
import { validate } from '../../utils/validate';

const router: Router = express.Router();

router.route('/').get(auth('admin', 'company'), validate(companyValidation.getCompanies), companyController.getCompanies);
router.route('/').post(auth('admin', 'company'), validate(companyValidation.getCompanies), companyController.getCompanies);

router
  .route('/:companyId')
  .get(auth('read', 'company'), validate(companyValidation.getCompany), companyController.getCompany)
  .patch(auth('update', 'company'), validate(companyValidation.updateCompany), companyController.updateCompany)
  .delete(auth('delete', 'company'), validate(companyValidation.deleteCompany), companyController.deleteCompany);

export default router;
