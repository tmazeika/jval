import { $number } from '../src';

describe('$number', () => {
  it('isType', () => {
    // ok
    expect($number().isType(-3)).toBe(true);
    expect($number().isType(0)).toBe(true);
    expect($number().isType(10.2)).toBe(true);
    expect($number().isType(Number.MIN_VALUE)).toBe(true);
    expect($number().isType(Number.MAX_VALUE)).toBe(true);
    expect($number().isType(Number.NEGATIVE_INFINITY)).toBe(true);
    expect($number().isType(Number.POSITIVE_INFINITY)).toBe(true);
    expect($number().isType(Number.NaN)).toBe(true);

    // bad
    expect($number().isType(true)).toBe(false);
    expect($number().isType([1, 'a'])).toBe(false);
    expect($number().isType(null)).toBe(false);
    expect($number().isType({ a: 1 })).toBe(false);
    expect($number().isType('a')).toBe(false);
    expect($number().isType(undefined)).toBe(false);
  });

  it('isValid min', () => {
    expect($number().min(2).isValid(-3)).toBe(false);
    expect($number().min(2).isValid(2)).toBe(true);
    expect($number().min(2).isValid(5.1)).toBe(true);
  });

  it('isValid max', () => {
    expect($number().max(2).isValid(-3)).toBe(true);
    expect($number().max(2).isValid(2)).toBe(true);
    expect($number().max(2).isValid(5)).toBe(false);
  });

  it('isValid int', () => {
    expect($number().int().isValid(-3)).toBe(true);
    expect($number().int().isValid(0.33)).toBe(false);
    expect($number().int().isValid(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect($number().int().isValid(Number.NaN)).toBe(false);
    expect($number().int().isValid(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('isValid unsafeInt', () => {
    expect($number().unsafeInt().isValid(8)).toBe(true);
    expect($number().unsafeInt().isValid(0.33)).toBe(false);
    expect(
      $number()
        .unsafeInt()
        .isValid(Number.MAX_SAFE_INTEGER + 1),
    ).toBe(true);
    expect($number().unsafeInt().isValid(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect($number().unsafeInt().isValid(Number.NaN)).toBe(false);
    expect($number().unsafeInt().isValid(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('isValid finite', () => {
    expect($number().finite().isValid(8)).toBe(true);
    expect($number().finite().isValid(3.14)).toBe(true);
    expect($number().finite().isValid(Number.MAX_VALUE)).toBe(true);
    expect($number().finite().isValid(Number.NEGATIVE_INFINITY)).toBe(false);
    expect($number().unsafeInt().isValid(Number.NaN)).toBe(false);
    expect($number().finite().isValid(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('map', () => {
    expect($number().map(99)).toBe(99);
    expect(
      $number()
        .thenMap((v) => (v ? 2 : 0))
        .map(8),
    ).toBe(2);
    expect(
      $number()
        .thenMap((v) => (v ? 2 : 0))
        .map(0),
    ).toBe(0);
  });
});
