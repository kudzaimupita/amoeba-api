import express, { Router } from 'express';

import auth from '../auth/auth.middleware';
import { validate } from '../../utils/validate';
import * as controller from './workspace.controller';
import * as validation from './workspace.validation';

const router: Router = express.Router();

router.post('/invitations/accept', auth(), validate(validation.acceptInvitation), controller.acceptInvitation);
router.get('/invitations/:token', validate(validation.previewInvitation), controller.previewInvitation);

router.use(auth());

router.get('/', controller.listWorkspaces);
router.post('/', validate(validation.createWorkspace), controller.createWorkspace);

router.get('/:workspaceId', validate(validation.workspaceIdParam), controller.getWorkspace);
router.patch('/:workspaceId', validate(validation.updateWorkspace), controller.updateWorkspace);
router.delete('/:workspaceId', validate(validation.workspaceIdParam), controller.deleteWorkspace);
router.post('/:workspaceId/switch', validate(validation.switchWorkspace), controller.switchWorkspace);

router.get('/:workspaceId/members', validate(validation.workspaceIdParam), controller.listMembers);
router.patch('/:workspaceId/members/:userId', validate(validation.updateMemberRole), controller.updateMemberRole);
router.delete('/:workspaceId/members/:userId', validate(validation.removeMember), controller.removeMember);

router.post('/:workspaceId/invitations', validate(validation.inviteMember), controller.inviteMember);
router.get('/:workspaceId/invitations', validate(validation.workspaceIdParam), controller.listInvitations);
router.delete('/:workspaceId/invitations/:invitationId', validate(validation.invitationIdParam), controller.revokeInvitation);

export default router;
