import generatePin from './generatePin';

describe('generatePin', () => {
  test('returns a 6-digit number', () => {
    const pin = generatePin();

    expect(pin).toBeGreaterThanOrEqual(100000);
    expect(pin).toBeLessThanOrEqual(999999);
  });

  test('generates varied values across repeated calls', () => {
    const pins = new Set(Array.from({ length: 20 }, () => generatePin()));
    expect(pins.size).toBeGreaterThan(1);
  });
});
