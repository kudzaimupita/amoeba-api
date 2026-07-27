import express, { Router } from 'express';
import { validate } from '../../utils/validate';
import { auth } from '../auth';
import * as apiKeyController from './apiKey.controller';
import * as apiKeyValidation from './apiKey.validation';

const router: Router = express.Router();

router
    .route('/')
    .post(
        auth('create', 'apiKey'),
        validate(apiKeyValidation.createApiKey),
        apiKeyController.createApiKey
    )
    .get(
        auth('read', 'apiKey'),
        validate(apiKeyValidation.getApiKeys),
        apiKeyController.getApiKeys
    );

router
    .route('/:id')
    .get(
        auth('read', 'apiKey'),
        validate(apiKeyValidation.getApiKey),
        apiKeyController.getApiKey
    )
    .patch(
        auth('update', 'apiKey'),
        validate(apiKeyValidation.updateApiKey),
        apiKeyController.updateApiKey
    )
    .delete(
        auth('delete', 'apiKey'),
        validate(apiKeyValidation.deleteApiKey),
        apiKeyController.deleteApiKey
    );

export default router;
