import { $custom } from '../../src/index';

describe('$custom', () => {
  const boolean = $custom((v): v is boolean => typeof v === 'boolean');
  it('isType', () => {
    // ok
    expect(boolean.isType(false)).toBe(true);
    expect($custom((v): v is number => typeof v === 'number').isType(1)).toBe(
      true,
    );

    // bad
    expect(boolean.isType([1, 'a'])).toBe(false);
    expect(boolean.isType(null)).toBe(false);
    expect(boolean.isType(3)).toBe(false);
    expect(boolean.isType({ a: 1 })).toBe(false);
    expect(boolean.isType('a')).toBe(false);
    expect(boolean.isType(undefined)).toBe(false);
  });

  it('isValid', () => {
    expect(boolean.isValid(true)).toBe(true);
    expect(boolean.isValid(false)).toBe(true);
  });

  it('map', () => {
    expect(boolean.map(true)).toBe(true);
    expect(boolean.map(false)).toBe(false);
    expect(boolean.thenMap((v) => (v ? 2 : 0)).map(true)).toBe(2);
    expect(boolean.thenMap((v) => (v ? 2 : 0)).map(false)).toBe(0);
  });
});
