import * as crypto from 'crypto';

export class IPUtil {
  private static IP_SALT = process.env.IP_HASH_SALT || 'your-secret-salt-here';

  // Clean and normalize IP address
  static cleanIP(rawIP: string): string {
    if (!rawIP) return 'unknown';

    // Handle IPv6 localhost
    if (rawIP === '::1' || rawIP === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    // Remove IPv6 prefix for IPv4 addresses
    if (rawIP.includes('::ffff:')) {
      return rawIP.split('::ffff:')[1];
    }

    // Handle IPv6 addresses
    if (rawIP.includes(':') && !rawIP.includes('.')) {
      // It's IPv6, return as is
      return rawIP.toLowerCase();
    }

    return rawIP;
  }

  // Hash IP for privacy
  static hashIP(ipAddress: string): string {
    const cleanedIP = this.cleanIP(ipAddress);

    // For localhost/development, use a consistent hash
    if (cleanedIP === '127.0.0.1' || cleanedIP === 'localhost') {
      return `dev_${crypto.createHash('sha256').update(`localhost${this.IP_SALT}`).digest('hex').substring(0, 12)}`;
    }

    return crypto
      .createHash('sha256')
      .update(cleanedIP + this.IP_SALT)
      .digest('hex')
      .substring(0, 16);
  }

  // Create session ID from IP
  static createSessionId(ipAddress: string): string {
    const hashedIP = this.hashIP(ipAddress);
    return `session_${hashedIP}_${Date.now()}`;
  }
}
