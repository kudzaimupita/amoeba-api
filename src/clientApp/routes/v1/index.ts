import express, { Router } from 'express';

import accountRoute from '../../../modules/account/account.route';
import { apiKeyRoute } from '../../../modules/apiKeys';
import config from '../../../config/config';
import tokenRoute from '../../../modules/token/token.route';
import activityLogRoute from './activityLog.route';
import authRoute from './auth.route';
import betaUserRoute from './betaUser.route';
import companyRoute from './company.route';
import docsRoute from './swagger.route';
import userRoute from './user.route';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  { path: '/auth', route: authRoute },
  { path: '/users', route: userRoute },
  { path: '/companies', route: companyRoute },
  { path: '/activity-logs', route: activityLogRoute },
  { path: '/beta-users', route: betaUserRoute },
  { path: '/tokens', route: tokenRoute },
  { path: '/api-keys', route: apiKeyRoute },
  { path: '/account', route: accountRoute },
];

const devIRoute: IRoute[] = [{ path: '/docs', route: docsRoute }];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
