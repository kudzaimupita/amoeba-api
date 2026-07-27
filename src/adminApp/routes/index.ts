import express, { Router } from 'express';

import tokenRoute from '../../modules/token/token.route';
import companyRoute from './company.route';
import userRoute from './user.route';
import waitlistRoute from './waitlist.route';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  { path: '/companies', route: companyRoute },
  { path: '/users', route: userRoute },
  { path: '/waitlist', route: waitlistRoute },
  { path: '/tokens', route: tokenRoute },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
