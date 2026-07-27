import crypto from 'crypto';

import { hashApiKey } from './apiKey.service';

describe('apiKey.service', () => {
  describe('hashApiKey', () => {
    test('returns a deterministic sha256 hash', () => {
      const key = 'sk_live_test_key_value';
      const expected = crypto.createHash('sha256').update(key).digest('hex');

      expect(hashApiKey(key)).toBe(expected);
      expect(hashApiKey(key)).toBe(hashApiKey(key));
    });

    test('produces different hashes for different keys', () => {
      expect(hashApiKey('sk_live_a')).not.toBe(hashApiKey('sk_live_b'));
    });
  });
});
