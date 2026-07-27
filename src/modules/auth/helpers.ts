/* eslint-disable prettier/prettier */
/* eslint-disable global-require */
/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */

import { Request } from 'express';
import IP from 'ip';
import UAParser from 'ua-parser-js';

export interface SessionDetails {
  ipAddress: string;
  device: string;
  userAgent: string;
  browser: string;
  os: string;
  timestamp: Date;
  loginType: string;
}

export const generateSessionConfig = (req: Request, loginType: string = 'email'): SessionDetails => {
  // Get client IP address properly
  const ipAddress = req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const parser = new UAParser(userAgent);
  const parserResults = parser.getResult();

  const sessionDetails: SessionDetails = {
    ipAddress,
    userAgent,
    browser: `${parserResults?.browser?.name || 'Unknown'} ${parserResults?.browser?.version || ''}`,
    os: `${parserResults?.os?.name || 'Unknown'} ${parserResults?.os?.version || ''}`,
    device: `${parserResults?.device?.vendor || ''} ${parserResults?.device?.model || 'Desktop'}`.trim(),
    timestamp: new Date(),
    loginType,
  };

  return sessionDetails;
};

export const test = (): boolean => {
  return true;
};


