import { Request, Response, NextFunction } from 'express';
import { SessionTrackerService } from './sessionTracker.service';
import { IPUtil } from './ip.util';
import {
  getClientIp,
  parseUserAgent,
  extractLocationInfo,
  generateAnonymousId,
  extractUtmParams,
} from './sessionTracker.utils';

export class SessionTrackerController {
  private service = new SessionTrackerService();

  getOrCreateSessionByIp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract IP from headers
      const rawIP =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket?.remoteAddress ||
        req.ip ||
        '::1'; // Default to localhost if nothing found

      // Clean and hash IP
      const cleanedIP = IPUtil.cleanIP(rawIP);
      const hashedIP = IPUtil.hashIP(rawIP);

      // void 0;

      // Find active session
      let session = await this.service.getActiveSessionByIp(hashedIP);

      if (session) {
        // void 0;
        session.lastActivityTime = new Date();
        await session.save();

        return res.json({
          success: true,
          sessionId: session.sessionId,
          isReturning: true,
          sessionNumber: session.sessionNumber,
          deviceType: session.deviceInfo?.deviceType || 'desktop',
        });
      }

      // Parse user agent
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = {
        ...parseUserAgent(userAgent),
        userAgent,
        screenResolution: '', // Will be updated from client
        viewport: { width: 0, height: 0 }, // Will be updated from client
      };

      // Get location data
      let locationInfo = extractLocationInfo(req);

      // For localhost, use default development location
      if (cleanedIP === '127.0.0.1' || cleanedIP === 'localhost') {
        locationInfo = {
          country: 'US',
          region: 'Development',
          city: 'Localhost',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currency: 'USD',
          language: req.headers['accept-language']?.split(',')[0] || 'en-US',
        };
      }

      // Create session ID
      const sessionId = IPUtil.createSessionId(rawIP);

      // void 0;

      // Generate anonymous ID
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new session
      session = await this.service.startSession({
        sessionId,
        ipAddress: hashedIP, // Store hashed IP only
        anonymousId,
        deviceInfo,
        locationInfo,
        entryData: {
          landingPage: '',
          referrer: req.headers.referer || '',
        },
      });

      // void 0;

      res.json({
        success: true,
        sessionId: session.sessionId,
        isReturning: session.sessionNumber > 1,
        sessionNumber: session.sessionNumber,
        deviceType: deviceInfo.deviceType,
      });
    } catch (error: any) {
      console.error('Session creation error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to create session: ${error.message}`,
      });
    }
  };

  startSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = req;

      // void 0;
      // void 0;
      // void 0;
      // void 0;

      // If sessionId provided, update existing session
      if (body.sessionId) {
        const existingSession = await this.service.getSession(body.sessionId);

        if (existingSession) {
          // Update device info - handle nested object properly
          if (body.deviceInfo) {
            existingSession.deviceInfo = {
              ...existingSession.deviceInfo,
              userAgent: body.deviceInfo.userAgent || existingSession.deviceInfo.userAgent,
              browser: body.deviceInfo.browser || existingSession.deviceInfo.browser,
              browserVersion: body.deviceInfo.browserVersion || existingSession.deviceInfo.browserVersion,
              os: body.deviceInfo.os || existingSession.deviceInfo.os,
              osVersion: body.deviceInfo.osVersion || existingSession.deviceInfo.osVersion,
              device: body.deviceInfo.device || existingSession.deviceInfo.device,
              deviceType: body.deviceInfo.deviceType || existingSession.deviceInfo.deviceType,
              isMobile:
                body.deviceInfo.isMobile !== undefined ? body.deviceInfo.isMobile : existingSession.deviceInfo.isMobile,
              screenResolution: body.deviceInfo.screenResolution || existingSession.deviceInfo.screenResolution,
              viewport: body.deviceInfo.viewport || existingSession.deviceInfo.viewport,
              pixelRatio: body.deviceInfo.pixelRatio || existingSession.deviceInfo.pixelRatio,
              colorDepth: body.deviceInfo.colorDepth || existingSession.deviceInfo.colorDepth,
              orientation: body.deviceInfo.orientation || existingSession.deviceInfo.orientation,
            };
            existingSession.markModified('deviceInfo');
          }

          // Update location info - handle nested object properly
          if (body.locationInfo) {
            existingSession.locationInfo = {
              ...existingSession.locationInfo,
              country: body.locationInfo.country || existingSession.locationInfo.country || '',
              region: body.locationInfo.region || existingSession.locationInfo.region || '',
              city: body.locationInfo.city || existingSession.locationInfo.city || '',
              timezone: body.locationInfo.timezone || existingSession.locationInfo.timezone,
              currency: body.locationInfo.currency || existingSession.locationInfo.currency,
              language: body.locationInfo.language || existingSession.locationInfo.language,
              languages: body.locationInfo.languages || existingSession.locationInfo.languages,
              locale: body.locationInfo.locale || existingSession.locationInfo.locale,
              platform: body.locationInfo.platform || existingSession.locationInfo.platform,
              cookieEnabled:
                body.locationInfo.cookieEnabled !== undefined
                  ? body.locationInfo.cookieEnabled
                  : existingSession.locationInfo.cookieEnabled,
              onLine:
                body.locationInfo.onLine !== undefined ? body.locationInfo.onLine : existingSession.locationInfo.onLine,
              doNotTrack:
                body.locationInfo.doNotTrack !== undefined
                  ? body.locationInfo.doNotTrack
                  : existingSession.locationInfo.doNotTrack,
            };
            existingSession.markModified('locationInfo');
          }

          // Update entry data - handle nested object properly
          if (body.entryData) {
            existingSession.entryData = {
              ...existingSession.entryData,
              landingPage: body.entryData.landingPage || existingSession.entryData.landingPage,
              fullUrl: body.entryData.fullUrl || existingSession.entryData.fullUrl,
              referrer: body.entryData.referrer || existingSession.entryData.referrer,
              referrerDomain: body.entryData.referrerDomain || existingSession.entryData.referrerDomain,
              utmSource: body.entryData.utmSource || existingSession.entryData.utmSource,
              utmMedium: body.entryData.utmMedium || existingSession.entryData.utmMedium,
              utmCampaign: body.entryData.utmCampaign || existingSession.entryData.utmCampaign,
              utmTerm: body.entryData.utmTerm || existingSession.entryData.utmTerm,
              utmContent: body.entryData.utmContent || existingSession.entryData.utmContent,
              gclid: body.entryData.gclid || existingSession.entryData.gclid,
              fbclid: body.entryData.fbclid || existingSession.entryData.fbclid,
              msclkid: body.entryData.msclkid || existingSession.entryData.msclkid,
            };
            existingSession.markModified('entryData');
          }

          existingSession.lastActivityTime = new Date();

          // Save with all modifications
          await existingSession.save();

          // void 0;
          // void 0;
          // void 0;

          return res.json({
            success: true,
            sessionId: existingSession.sessionId,
            message: 'Session updated with complete data',
          });
        }
        console.error('Session not found:', body.sessionId);
        return res.json({
          success: false,
          error: 'Session not found',
        });
      }

      // Create new session if no sessionId or session not found
      const ipAddress = getClientIp(req);

      // Parse user agent
      const userAgent = req.headers['user-agent'] || '';
      const baseDeviceInfo = parseUserAgent(userAgent);

      // Merge device info from body with parsed info
      const deviceInfo = body.deviceInfo
        ? {
            ...baseDeviceInfo,
            userAgent,
            ...body.deviceInfo,
          }
        : {
            ...baseDeviceInfo,
            userAgent,
          };

      // Extract base location info
      const baseLocationInfo = extractLocationInfo(req);

      // Merge location info from body with extracted info
      const locationInfo = body.locationInfo
        ? {
            ...baseLocationInfo,
            ...body.locationInfo,
          }
        : baseLocationInfo;

      // Generate anonymous ID if not provided
      const anonymousId = body.anonymousId || generateAnonymousId(ipAddress, userAgent);

      // Handle entry data
      const entryData = body.entryData || {
        landingPage: body.landingPage || '/',
        referrer: req.headers.referer || body.referrer || '',
      };

      const session = await this.service.startSession({
        ipAddress,
        anonymousId,
        userId: body.userId,
        deviceInfo,
        locationInfo,
        entryData,
      });

      res.json({
        success: true,
        sessionId: session.sessionId,
        sessionNumber: session.sessionNumber,
        isReturning: session.sessionNumber > 1,
        deviceType: deviceInfo.deviceType,
      });
    } catch (error: any) {
      console.error('Start session error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  recordEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, eventType, eventData, timestamp } = req.body;

      const result = await this.service.recordEvent(sessionId, eventType, eventData);

      // Check if the result indicates failure
      if (!result.success) {
        // Don't throw 500, return 200 with success: false
        return res.status(200).json({
          success: false,
          error: result.error || result.reason || 'Failed to record event',
        });
      }

      res.json({
        success: true,
        message: result.message || 'Event recorded',
      });
    } catch (error: any) {
      console.error('Event recording error:', error);

      // Don't throw 500 for missing sessions
      if (error.message === 'Session not found') {
        return res.status(200).json({
          success: false,
          error: 'Session not found',
          hint: 'Session may have expired or not been created yet',
        });
      }

      // For other errors, return 500
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await this.service.getSession(req.params.sessionId);

      res.json({
        success: true,
        session,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await this.service.getUserSessions(req.params.anonymousId);

      res.json({
        success: true,
        sessions,
        totalSessions: sessions.length,
      });
    } catch (error) {
      next(error);
    }
  };

  getDwellAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const analytics = await this.service.getDwellAnalytics(
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserSessionsByIp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = req.params.ipAddress || getClientIp(req);
      const sessions = await this.service.getUserSessionsByIp(ipAddress);

      res.json({
        success: true,
        sessions,
        totalSessions: sessions.length,
      });
    } catch (error) {
      next(error);
    }
  };

  saveDataBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, formId, formData } = req.body;

      // void 0;

      if (!sessionId || !formId) {
        return res.json({
          success: false,
          error: 'Missing sessionId or formId',
        });
      }

      // Don't save if form data is empty or all fields are empty
      if (!formData || Object.values(formData).every((v) => v === '' || v === null)) {
        // void 0;
        return res.json({
          success: true,
          message: 'Form is empty, backup skipped',
        });
      }

      // Check if session exists
      let session = await this.service.getSession(sessionId);

      // If session doesn't exist, create a minimal one for form backup
      if (!session) {
        // void 0;

        // Extract hashed IP from sessionId if possible
        const hashedIP = sessionId.split('_')[1] || 'unknown';

        session = await this.service.createMinimalSession({
          sessionId,
          ipAddress: hashedIP,
          anonymousId: `anon_backup_${Date.now()}`,
          deviceInfo: {
            deviceType: 'desktop',
          },
          locationInfo: {
            language: 'en-US',
            currency: 'USD',
          },
          dataBackup: { [formId]: formData },
        });

        return res.json({
          success: true,
          message: 'Backup saved in new session',
        });
      }

      // Save to existing session
      const result = await this.service.saveDataBackup(sessionId, formId, formData);

      // void 0;

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Save backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getDataBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { formId } = req.query;

      const backup = await this.service.getDataBackup(sessionId, formId as string | undefined);

      res.json({
        success: true,
        backup,
      });
    } catch (error) {
      next(error);
    }
  };

  clearDataBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { formId } = req.body;

      const result = await this.service.clearDataBackup(sessionId, formId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
