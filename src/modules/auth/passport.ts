import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github';

import tokenTypes from '../token/token.types';
import config from '../../config/config';
import User from '../user/user.model';
import { IPayload } from '../token/token.interfaces';
import { companyService } from '../company';
import { PlanType } from '../../config/billingPlans';

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  },
  async (payload: IPayload, done) => {
    try {
      if (payload.type !== tokenTypes.ACCESS) {
        throw new Error('Invalid token type');
      }
      const user = await User.findById(payload.sub);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
);

// Google OAuth Strategy (conditional initialization)
console.log('[OAuth Debug] API URL:', config.apiUrl);
console.log('[OAuth Debug] Google config:', {
  clientId: config.oauth?.google?.clientId ? '***' + config.oauth.google.clientId.slice(-4) : 'NOT SET',
  callbackUrl: config.oauth?.google?.callbackUrl || 'NOT SET',
});
const googleStrategy = config.oauth?.google?.clientId
  ? new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackUrl,
        passReqToCallback: true, // Pass request to callback
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const { id, emails, displayName, photos, _json } = profile;
          const email = emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          const avatarUrl = photos?.[0]?.value || _json?.picture;

          // Get client IP address from request
          const ipAddress =
            req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.headers['x-forwarded-for'] ||
            '127.0.0.1';

          const oauthData = {
            provider: 'google',
            providerId: id,
            email,
            name: displayName,
            avatarUrl,
          };

          // Check if user exists with this email
          let user = await User.findOne({ email });

          if (user) {
            // Check if beta whitelisting is enabled and user is whitelisted (even for existing users)
            if (config.betaWhitelistEnabled) {
              const { betaUserService } = await import('../betaUsers/betaUser.service');
              const isWhitelisted = await betaUserService.isEmailWhitelisted(email);
              if (!isWhitelisted) {
                return done(new Error('Beta access required. Please join our waitlist.'), null);
              }
            }

            // User exists - link or update OAuth account
            user.addOAuthProvider(oauthData);

            // Update last login details
            user.lastLogin = new Date();
            user.lastLoginIP = ipAddress;
            user.currentUserAgent = req.headers['user-agent'] || 'Unknown';
            await user.save();
          } else {
            // Check if beta whitelisting is enabled and user is whitelisted
            if (config.betaWhitelistEnabled) {
              const { betaUserService } = await import('../betaUsers/betaUser.service');
              const isWhitelisted = await betaUserService.isEmailWhitelisted(email);
              if (!isWhitelisted) {
                return done(new Error('Beta access required. Please join our waitlist.'), null);
              }
            }

            // Create new user
            user = new User({
              name: displayName,
              email,
              isEmailVerified: true,
              hasPassword: false,
              acceptedInvitation: true,
              isSystemUser: true,
              status: 'active',
              permissions: ['SYSTEM_USER'],
              isBoarded: false,
              isOrgSetup: true,
              currentTokens: 1000000,
              lastLogin: new Date(),
              lastLoginIP: ipAddress,
              currentUserAgent: req.headers['user-agent'] || 'Unknown',
              oauthProviders: [{ ...oauthData, linkedAt: new Date() }],
            });
            await user.save();

            // Create company for new OAuth user
            const company = await companyService.createCompany({
              name: `${displayName} Workspace`,
              systemUser: user._id,
              billing: {
                plan: PlanType.FREE,
                paystackCustomerId: null,
                paystackCustomerData: null,
              },
            });

            // Update user with company ID
            user.company = company._id;
            await user.save();
          }

          // Attach IP address and user agent to the user object for use in callback
          (user as any).loginIpAddress = ipAddress;
          (user as any).loginUserAgent = req.headers['user-agent'] || 'Unknown';

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  : null;

// GitHub OAuth Strategy (conditional initialization)
console.log('[OAuth Debug] GitHub config:', {
  clientId: config.oauth?.github?.clientId ? '***' + config.oauth.github.clientId.slice(-4) : 'NOT SET',
  clientSecret: config.oauth?.github?.clientSecret ? '***' + config.oauth.github.clientSecret.slice(-4) : 'NOT SET',
  callbackUrl: config.oauth?.github?.callbackUrl || 'NOT SET',
});
const githubStrategy = config.oauth?.github?.clientId
  ? new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackUrl,
        passReqToCallback: true, // Pass request to callback
      },
      async (req, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const { id, emails: profileEmails, displayName, username, photos, profileUrl, _json } = profile;

          // passport-github v1 doesn't reliably return emails — fetch from GitHub API
          let email = profileEmails?.find((e: any) => e.primary)?.value || profileEmails?.[0]?.value;

          if (!email) {
            try {
              const res = await fetch('https://api.github.com/user/emails', {
                headers: {
                  Authorization: `token ${accessToken}`,
                  Accept: 'application/vnd.github.v3+json',
                  'User-Agent': 'Servly-App',
                },
              });
              if (res.ok) {
                const ghEmails = await res.json();
                const primary = ghEmails.find((e: any) => e.primary && e.verified);
                email = primary?.email || ghEmails.find((e: any) => e.verified)?.email || ghEmails[0]?.email;
              }
            } catch (fetchErr) {
              console.error('Failed to fetch GitHub emails:', fetchErr);
            }
          }

          if (!email) {
            return done(new Error('No email found in GitHub profile. Please make your email public in GitHub Settings > Emails.'), null);
          }

          const name = displayName || _json?.name || username;
          const avatarUrl = photos?.[0]?.value || _json?.avatar_url;
          const githubProfileUrl = profileUrl || _json?.html_url;

          // Get client IP address from request
          const ipAddress =
            req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.headers['x-forwarded-for'] ||
            '127.0.0.1';

          const oauthData = {
            provider: 'github',
            providerId: String(id),
            email,
            name,
            username,
            avatarUrl,
            profileUrl: githubProfileUrl,
          };

          // Check if user exists with this email
          let user = await User.findOne({ email });

          if (user) {
            // Check if beta whitelisting is enabled and user is whitelisted (even for existing users)
            if (config.betaWhitelistEnabled) {
              const { betaUserService } = await import('../betaUsers/betaUser.service');
              const isWhitelisted = await betaUserService.isEmailWhitelisted(email);
              if (!isWhitelisted) {
                return done(new Error('Beta access required. Please join our waitlist.'), null);
              }
            }

            // User exists - link or update OAuth account
            user.addOAuthProvider(oauthData);

            // Update last login details
            user.lastLogin = new Date();
            user.lastLoginIP = ipAddress;
            user.currentUserAgent = req.headers['user-agent'] || 'Unknown';
            await user.save();
          } else {
            // Check if beta whitelisting is enabled and user is whitelisted
            if (config.betaWhitelistEnabled) {
              const { betaUserService } = await import('../betaUsers/betaUser.service');
              const isWhitelisted = await betaUserService.isEmailWhitelisted(email);
              if (!isWhitelisted) {
                return done(new Error('Beta access required. Please join our waitlist.'), null);
              }
            }

            // Create new user
            user = new User({
              name,
              email,
              isEmailVerified: true,
              hasPassword: false,
              acceptedInvitation: true,
              isSystemUser: true,
              status: 'active',
              permissions: ['SYSTEM_USER'],
              isBoarded: false,
              isOrgSetup: true,
              currentTokens: 1000000,
              lastLogin: new Date(),
              lastLoginIP: ipAddress,
              currentUserAgent: req.headers['user-agent'] || 'Unknown',
              oauthProviders: [{ ...oauthData, linkedAt: new Date() }],
            });
            await user.save();

            // Create company for new OAuth user
            const company = await companyService.createCompany({
              name: `${name} Workspace`,
              systemUser: user._id,
              billing: {
                plan: PlanType.FREE,
                paystackCustomerId: null,
                paystackCustomerData: null,
              },
            });

            // Update user with company ID
            user.company = company._id;
            await user.save();
          }

          // Attach IP address and user agent to the user object for use in callback
          (user as any).loginIpAddress = ipAddress;
          (user as any).loginUserAgent = req.headers['user-agent'] || 'Unknown';

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  : null;

export { jwtStrategy, googleStrategy, githubStrategy };
export default jwtStrategy;
