import { Request } from 'express';
import UAParser from 'ua-parser-js';

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot';
  isMobile: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  language: string;
}

/**
 * Extract client IP address from request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIp = req.headers['x-real-ip'] as string;
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string;

  let ip: string;

  if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else {
    ip = req.socket?.remoteAddress || req.ip || 'unknown';
  }

  // Clean IPv6 mapped IPv4 addresses (::ffff:192.168.1.1)
  return cleanIpAddress(ip);
}

/**
 * Clean IP address (handle IPv6 mapped IPv4)
 */
export function cleanIpAddress(ipAddress: string): string {
  if (!ipAddress) return 'unknown';

  // Handle IPv6 mapped IPv4 addresses like ::ffff:192.168.1.1
  if (ipAddress.includes('::ffff:')) {
    return ipAddress.split('::ffff:')[1];
  }

  // Handle IPv6 localhost
  if (ipAddress === '::1') {
    return '127.0.0.1';
  }

  return ipAddress;
}

/**
 * Parse user agent string to extract device and browser info
 */
export function parseUserAgent(userAgentString: string): ParsedUserAgent {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const deviceType = getDeviceType(result);

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    device: result.device.model || result.device.vendor || 'Unknown',
    deviceType,
    isMobile: deviceType === 'mobile' || deviceType === 'tablet',
  };
}

/**
 * Determine device type from UAParser result
 */
function getDeviceType(result: UAParser.IResult): 'desktop' | 'mobile' | 'tablet' | 'bot' {
  if (result.device.type === 'mobile') return 'mobile';
  if (result.device.type === 'tablet') return 'tablet';

  const ua = result.ua?.toLowerCase() || '';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return 'bot';
  }

  return 'desktop';
}

/**
 * Extract location info from request headers
 */
export function extractLocationInfo(req: Request): LocationInfo {
  const acceptLanguage = (req.headers['accept-language'] as string) || 'en';
  const language = acceptLanguage.split(',')[0].split('-')[0];

  // These headers might be set by a reverse proxy or CDN like Cloudflare
  const country = (req.headers['cf-ipcountry'] as string) || (req.headers['x-country-code'] as string);
  const region = (req.headers['cf-region'] as string) || (req.headers['x-region'] as string);
  const city = (req.headers['cf-city'] as string) || (req.headers['x-city'] as string);
  const timezone = (req.headers['cf-timezone'] as string) || (req.headers['x-timezone'] as string);

  // Currency can be inferred from country or explicitly passed
  const currency = getCurrencyFromCountry(country) || 'USD';

  return {
    country,
    region,
    city,
    timezone,
    currency,
    language,
  };
}

/**
 * Map country code to currency
 */
export function getCurrencyFromCountry(countryCode?: string): string {
  if (!countryCode) return 'USD';

  const currencyMap: Record<string, string> = {
    // Americas
    US: 'USD',
    CA: 'CAD',
    MX: 'MXN',
    BR: 'BRL',
    AR: 'ARS',
    CL: 'CLP',
    CO: 'COP',
    PE: 'PEN',

    // Europe
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    CH: 'CHF',
    SE: 'SEK',
    NO: 'NOK',
    DK: 'DKK',
    PL: 'PLN',
    RU: 'RUB',
    TR: 'TRY',

    // Asia Pacific
    JP: 'JPY',
    CN: 'CNY',
    IN: 'INR',
    KR: 'KRW',
    AU: 'AUD',
    NZ: 'NZD',
    SG: 'SGD',
    HK: 'HKD',
    TH: 'THB',
    MY: 'MYR',
    ID: 'IDR',
    PH: 'PHP',

    // Africa & Middle East
    ZA: 'ZAR',
    AE: 'AED',
    SA: 'SAR',
    IL: 'ILS',
    EG: 'EGP',
    NG: 'NGN',
    KE: 'KES',
    GH: 'GHS',
  };

  return currencyMap[countryCode.toUpperCase()] || 'USD';
}

/**
 * Check if session is expired (24 hours old)
 */
export function isSessionExpired(lastActivityTime: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - lastActivityTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= 24;
}

/**
 * Generate anonymous ID from IP address and user agent
 */
export function generateAnonymousId(ipAddress: string, userAgent: string): string {
  // Create a simple hash from IP and user agent
  const combined = `${ipAddress}_${userAgent}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }

  return `anon_${Math.abs(hash)}_${Date.now()}`;
}

/**
 * Extract UTM parameters from URL
 */
export function extractUtmParams(url: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  try {
    const urlObj = new URL(url, 'http://example.com'); // Add base URL for relative URLs
    const params = urlObj.searchParams;

    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  } catch {
    return {};
  }
}
