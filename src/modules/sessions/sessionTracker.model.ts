import { Schema, model, Document, Types } from 'mongoose';

interface IPageVisitEvent {
  type: 'page_visit';
  pageUrl: string;
  pageTitle: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ISectionDwellEvent {
  type: 'section_dwell';
  pageUrl: string;
  sectionId: string;
  dwellTime: number;
  scrollPosition?: {
    x: number;
    y: number;
    percentage: number;
  };
  timestamp: Date;
  interactions?: Record<string, number>;
}

interface IPageChangeEvent {
  type: 'page_change';
  fromUrl: string;
  toUrl: string;
  timestamp: Date;
}

interface IPageCloseEvent {
  type: 'page_close';
  pageUrl: string;
  timeOnPage: number;
  timestamp: Date;
}

export type TrackingEvent = IPageVisitEvent | ISectionDwellEvent | IPageChangeEvent | IPageCloseEvent;

export interface ISessionTracker extends Document {
  sessionId: string;
  anonymousId: string;
  ipAddress: string;
  userId?: Types.ObjectId;
  previousSessionId?: string;
  sessionNumber: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  lastActivityTime: Date;
  events: Array<{
    eventType: 'page_visit' | 'section_dwell' | 'page_change' | 'page_close';
    timestamp: Date;
    data: any;
  }>;
  metrics: {
    totalPageViews: number;
    totalDwellEvents: number;
    totalDuration: number;
    pagesVisited: string[];
    sectionsWithDwell: string[];
  };
  deviceInfo: {
    userAgent: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot';
    isMobile: boolean;
    screenResolution?: string;
    viewport?: {
      width: number;
      height: number;
    };
    pixelRatio?: number;
    colorDepth?: number;
    orientation?: string;
  };
  locationInfo: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    currency?: string;
    language: string;
    languages?: string[];
    locale?: string;
    platform?: string;
    cookieEnabled?: boolean;
    onLine?: boolean;
    doNotTrack?: boolean;
  };
  entryData: {
    landingPage?: string;
    fullUrl?: string;
    referrer?: string;
    referrerDomain?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    gclid?: string;
    fbclid?: string;
    msclkid?: string;
  };
  dataBackup?: Record<string, any>;
}

const SessionTrackerSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },

    previousSessionId: { type: String, index: true },
    sessionNumber: { type: Number, default: 1 },

    startTime: { type: Date, required: true },
    endTime: { type: Date },
    isActive: { type: Boolean, default: true },
    lastActivityTime: { type: Date, required: true },

    events: [
      {
        eventType: {
          type: String,
          enum: ['page_visit', 'section_dwell', 'page_change', 'page_close'],
          required: true,
        },
        timestamp: { type: Date, required: true },
        data: { type: Schema.Types.Mixed },
      },
    ],

    metrics: {
      totalPageViews: { type: Number, default: 0 },
      totalDwellEvents: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      pagesVisited: [String],
      sectionsWithDwell: [String],
    },

    deviceInfo: {
      userAgent: { type: String, default: '' },
      browser: String,
      browserVersion: String,
      os: String,
      osVersion: String,
      device: String,
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'bot'],
        default: 'desktop',
      },
      isMobile: { type: Boolean, default: false },
      screenResolution: String,
      viewport: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
      pixelRatio: { type: Number, default: 1 },
      colorDepth: { type: Number, default: 24 },
      orientation: String,
    },

    locationInfo: {
      country: { type: String, default: '' },
      region: { type: String, default: '' },
      city: { type: String, default: '' },
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en-US' },
      languages: [String],
      locale: String,
      platform: String,
      cookieEnabled: Boolean,
      onLine: Boolean,
      doNotTrack: Boolean,
    },

    entryData: {
      landingPage: String,
      fullUrl: String,
      referrer: String,
      referrerDomain: String,
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
      utmTerm: String,
      utmContent: String,
      gclid: String,
      fbclid: String,
      msclkid: String,
    },

    dataBackup: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false, // Important: Don't minimize empty objects
    strict: false, // Allow fields not defined in schema
  }
);

SessionTrackerSchema.index({ ipAddress: 1, startTime: -1 });
SessionTrackerSchema.index({ anonymousId: 1, startTime: -1 });
SessionTrackerSchema.index({ lastActivityTime: 1 });

export const SessionTrackerModel = model<ISessionTracker>('SessionTracker', SessionTrackerSchema);
