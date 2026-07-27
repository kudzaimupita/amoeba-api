import { hashRecoveryCode, normalizeRecoveryCode } from './recoveryCode.service';

describe('recoveryCode.service', () => {
  test('normalizeRecoveryCode strips separators and uppercases', () => {
    expect(normalizeRecoveryCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normalizeRecoveryCode(' abcd efgh ')).toBe('ABCDEFGH');
  });

  test('hashRecoveryCode is deterministic for normalized input', () => {
    expect(hashRecoveryCode('ABCD-EFGH')).toBe(hashRecoveryCode('abcdefgh'));
  });
});
