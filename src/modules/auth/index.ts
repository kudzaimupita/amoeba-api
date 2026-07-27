import * as authController from './auth.controller';
import auth from './auth.middleware';
import * as authService from './auth.service';
import * as authValidation from './auth.validation';
import jwtStrategy, { googleStrategy, githubStrategy } from './passport';

export { authController, auth, authService, authValidation, jwtStrategy, googleStrategy, githubStrategy };
