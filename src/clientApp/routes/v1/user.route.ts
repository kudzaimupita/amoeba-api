import express, { Router } from 'express';
import { userController, userValidation } from '../../../modules/user';

import { auth } from '../../../modules/auth';
import { validate } from '../../../utils/validate';
import { getInsights } from '../../../modules/user/user.controller';

const router: Router = express.Router();

router
  .route('/')
  .post(auth('create', 'user'), validate(userValidation.createUser), userController.inviteUser)
  .get(auth('readList', 'user'), validate(userValidation.getUsers), userController.getUsers);
router.get('/analytics', auth('read', 'user'), getInsights);
router
  .route('/:userId')
  .get(auth('read', 'user'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('update', 'user'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('delete', 'user'), validate(userValidation.deleteUser), userController.deleteUser);

// Fix user acceptance status
router
  .route('/:userId/fix-acceptance')
  .patch(auth('update', 'user'), validate(userValidation.getUser), userController.fixUserAcceptanceStatus);

export default router;
