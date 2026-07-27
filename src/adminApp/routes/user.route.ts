/* eslint-disable prettier/prettier */

import express, { Router } from 'express';

import { auth } from '../../modules/auth';
import { userController } from '../../modules/user';

const router: Router = express.Router();

router
  .route('/')
//   .post(auth('create', 'adminUser'), userController.inviteUser)
  .get(auth('read', 'adminUser'),  userController.getAdminUsers);

// router
//   .route('/:userId')
//   .get(auth('read', 'adminUser'),  userController.getUser)
//   .patch(auth('update', 'adminUser'),  userController.updateUser)
//   .delete(auth('delete', 'adminUser'),  userController.deleteUser);

export default router;
