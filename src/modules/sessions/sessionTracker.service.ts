import { SessionTrackerModel, ISessionTracker } from './sessionTracker.model';
import { isSessionExpired } from './sessionTracker.utils';

export class SessionTrackerService {
  async getActiveSessionByIp(ipAddress: string): Promise<ISessionTracker | null> {
    return SessionTrackerModel.findOne({
      ipAddress,
      isActive: true,
      lastActivityTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ lastActivityTime: -1 });
  }

  async startSession(data: {
    sessionId?: string;
    ipAddress: string;
    anonymousId: string;
    userId?: string;
    deviceInfo: any;
    locationInfo: any;
    entryData: any;
  }): Promise<ISessionTracker> {
    // Check for existing active session from same IP within 24 hours
    let session = await SessionTrackerModel.findOne({
      ipAddress: data.ipAddress,
      isActive: true,
      lastActivityTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // If session exists but is expired (>24 hours), close it
    if (session && isSessionExpired(session.lastActivityTime)) {
      session.isActive = false;
      session.endTime = new Date();
      await session.save();
      session = null;
    }

    // Return existing active session if found
    if (session) {
      session.lastActivityTime = new Date();
      await session.save();
      return session;
    }

    // Find previous sessions from same IP for linking
    const previousSession = await SessionTrackerModel.findOne({
      ipAddress: data.ipAddress,
      isActive: false,
    }).sort({ endTime: -1 });

    const sessionNumber = previousSession ? previousSession.sessionNumber + 1 : 1;
    const sessionId = data.sessionId || `${data.ipAddress.replace(/\./g, '_')}_${Date.now()}`;
    const now = new Date();

    session = new SessionTrackerModel({
      sessionId,
      anonymousId: data.anonymousId,
      ipAddress: data.ipAddress,
      userId: data.userId,
      previousSessionId: previousSession?.sessionId,
      sessionNumber,
      startTime: now,
      lastActivityTime: now,
      deviceInfo: data.deviceInfo,
      locationInfo: data.locationInfo,
      entryData: data.entryData,
      events: [],
      metrics: {
        totalPageViews: 0,
        totalDwellEvents: 0,
        totalDuration: 0,
        pagesVisited: [],
        sectionsWithDwell: [],
      },
    });

    await session.save();
    return session;
  }

  async recordEvent(sessionId: string, eventType: string, eventData: any): Promise<any> {
    // void 0;

    // Find session
    let session = await SessionTrackerModel.findOne({ sessionId });

    // If session not found, try to create a minimal one
    if (!session) {
      // void 0;

      // Extract hashed IP from sessionId if possible (format: session_hashedIP_timestamp)
      const parts = sessionId.split('_');
      const hashedIP = parts[1] || 'unknown';

      try {
        session = await SessionTrackerModel.create({
          sessionId,
          ipAddress: hashedIP,
          anonymousId: `anon_recovered_${Date.now()}`,
          sessionNumber: 1,
          startTime: new Date(),
          lastActivityTime: new Date(),
          isActive: true,
          events: [],
          metrics: {
            totalPageViews: 0,
            totalDwellEvents: 0,
            totalDuration: 0,
            pagesVisited: [],
            sectionsWithDwell: [],
          },
          deviceInfo: {
            deviceType: 'desktop',
            userAgent: '',
            browser: '',
            browserVersion: '',
            os: '',
            osVersion: '',
            device: '',
            isMobile: false,
          },
          locationInfo: {
            language: 'en-US',
            currency: 'USD',
          },
          entryData: {},
          dataBackup: {},
        });

        // void 0;
      } catch (createError) {
        console.error('Failed to create recovery session:', createError);
        // Don't throw - just return success false
        return {
          success: false,
          error: 'Session not found and could not create recovery session',
        };
      }
    }

    // Check if session is expired
    if (isSessionExpired(session.lastActivityTime)) {
      session.isActive = false;
      session.endTime = new Date();
      await session.save();
      return { success: false, reason: 'Session expired (>24 hours)' };
    }

    // Skip section_dwell events with low dwell time
    if (eventType === 'section_dwell' && eventData?.dwellTime < 60000) {
      return { success: false, reason: 'Dwell time less than 1 minute' };
    }

    // Add event to session
    const event = {
      eventType: eventType as any,
      timestamp: new Date(),
      data: eventData || {},
    };

    session.events.push(event);

    // Update metrics based on event type
    switch (eventType) {
      case 'page_visit':
        session.metrics.totalPageViews++;
        const pageUrl = eventData?.pageUrl;
        if (pageUrl && !session.metrics.pagesVisited.includes(pageUrl)) {
          session.metrics.pagesVisited.push(pageUrl);
        }
        // void 0;
        break;

      case 'section_dwell':
        session.metrics.totalDwellEvents++;
        const sectionId = eventData?.sectionId;
        if (sectionId && !session.metrics.sectionsWithDwell.includes(sectionId)) {
          session.metrics.sectionsWithDwell.push(sectionId);
        }
        // void 0;
        break;

      case 'page_close':
        const duration = eventData?.timeOnPage || 0;
        session.metrics.totalDuration += duration;
        // void 0;

        if (eventData?.closeType === 'tab_close' || eventData?.closeType === 'window_close') {
          session.isActive = false;
          session.endTime = new Date();
          session.metrics.totalDuration = session.endTime.getTime() - session.startTime.getTime();
        }
        break;
    }

    // Update last activity
    session.lastActivityTime = new Date();

    // Save session
    await session.save();

    return {
      success: true,
      message: 'Event tracked successfully',
    };
  }

  async getSession(sessionId: string): Promise<ISessionTracker | null> {
    return SessionTrackerModel.findOne({ sessionId });
  }

  async getUserSessions(anonymousId: string): Promise<ISessionTracker[]> {
    return SessionTrackerModel.find({ anonymousId }).sort({ startTime: -1 }).limit(10);
  }

  async getUserSessionsByIp(ipAddress: string): Promise<ISessionTracker[]> {
    return SessionTrackerModel.find({ ipAddress }).sort({ startTime: -1 }).limit(10);
  }

  async saveDataBackup(sessionId: string, formId: string, formData: any): Promise<any> {
    const session = await SessionTrackerModel.findOne({ sessionId });
    if (!session) throw new Error('Session not found');

    // Initialize dataBackup as object if not exists
    if (!session.dataBackup || typeof session.dataBackup !== 'object') {
      session.dataBackup = {};
    }

    // Save form data directly (not wrapped in extra object)
    session.dataBackup[formId] = formData;
    session.markModified('dataBackup');

    session.lastActivityTime = new Date();
    await session.save();

    return {
      success: true,
      message: 'Form data backed up',
      formId,
    };
  }

  async createMinimalSession(data: any): Promise<ISessionTracker> {
    const now = new Date();

    const session = new SessionTrackerModel({
      sessionId: data.sessionId,
      anonymousId: data.anonymousId,
      ipAddress: data.ipAddress,
      sessionNumber: 1,
      startTime: now,
      lastActivityTime: now,
      isActive: true,
      deviceInfo: data.deviceInfo || {},
      locationInfo: data.locationInfo || {},
      entryData: data.entryData || {},
      dataBackup: data.dataBackup || {},
      events: [],
      metrics: {
        totalPageViews: 0,
        totalDwellEvents: 0,
        totalDuration: 0,
        pagesVisited: [],
        sectionsWithDwell: [],
      },
    });

    await session.save();
    return session;
  }

  async getDataBackup(sessionId: string, formId?: string): Promise<any> {
    const session = await SessionTrackerModel.findOne({ sessionId });
    if (!session) throw new Error('Session not found');

    if (!session.dataBackup) {
      return null;
    }

    if (formId) {
      return session.dataBackup[formId] || null;
    }

    return session.dataBackup;
  }

  async clearDataBackup(sessionId: string, formId?: string): Promise<any> {
    const session = await SessionTrackerModel.findOne({ sessionId });
    if (!session) throw new Error('Session not found');

    if (formId && session.dataBackup) {
      delete session.dataBackup[formId];
    } else {
      session.dataBackup = {};
    }

    await session.save();

    return {
      success: true,
      message: formId ? `Backup cleared for form ${formId}` : 'All backups cleared',
    };
  }

  async getDwellAnalytics(dateFrom?: Date, dateTo?: Date): Promise<any> {
    const query: any = {
      'events.eventType': 'section_dwell',
    };

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    const sessions = await SessionTrackerModel.find(query);

    const dwellMap = new Map();

    sessions.forEach((session) => {
      session.events
        .filter((e) => e.eventType === 'section_dwell')
        .forEach((event) => {
          const { sectionId } = event.data as any;
          const existing = dwellMap.get(sectionId) || { count: 0, totalTime: 0 };
          existing.count++;
          existing.totalTime += (event.data as any).dwellTime;
          dwellMap.set(sectionId, existing);
        });
    });

    return {
      sections: Object.fromEntries(dwellMap),
      totalSessions: sessions.length,
    };
  }
}
