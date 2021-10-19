import { $boolean, $number, $object, $string } from '../src';

describe('$object', () => {
  it('isType', () => {
    // ok
    expect($object({ a: $number() }).isType({ a: 3 })).toBe(true);
    expect($object({ a: $number() }).isType({ a: 3, b: '3' })).toBe(true);
    expect(
      $object({ a: $boolean(), b: $string() }).isType({ a: true, b: '' }),
    ).toBe(true);
    expect($object({}).isType({})).toBe(true);
    expect($object({}).isType([1, 'a'])).toBe(true);
    expect($object({ 0: $number(), 1: $string() }).isType([1, 'a'])).toBe(true);
    expect($object({}).isType({ a: 1 })).toBe(true);

    // bad
    expect($object({}).isType(true)).toBe(false);
    expect($object({}).isType(null)).toBe(false);
    expect($object({}).isType(3)).toBe(false);
    expect($object({ a: $number() }).isType({})).toBe(false);
    expect($object({ a: $number() }).isType({ b: 1 })).toBe(false);
    expect($object({ 0: $number(), 2: $string() }).isType([1, 'a'])).toBe(
      false,
    );
    expect($object({}).isType('a')).toBe(false);
    expect($object({}).isType(undefined)).toBe(false);
  });

  it('strict', () => {
    expect($object({ a: $number() }).strict().isType({ a: 3 })).toBe(true);
    expect($object({ a: $number() }).strict().isType({ a: 3, b: '3' })).toBe(
      false,
    );
    expect(
      $object({ a: $boolean(), b: $string() })
        .strict()
        .isType({ a: true, b: '' }),
    ).toBe(true);
    expect($object({}).strict().isType({})).toBe(true);
    expect($object({}).strict().isType([1, 'a'])).toBe(false);
    expect($object({}).strict().isType({ a: 1 })).toBe(false);
    expect($object({ a: $number() }).strict().isType({})).toBe(false);
    expect($object({ a: $number() }).strict().isType({ b: 1 })).toBe(false);
    expect(
      $object({ 0: $number(), 1: $string() }).strict().isType([1, 'a']),
    ).toBe(false);
    expect(
      $object({ 0: $number(), 2: $string() }).strict().isType([1, 'a']),
    ).toBe(false);
  });

  it('isValid', () => {
    expect($object({}).isValid({})).toBe(true);
    expect($object({ a: $number() }).isValid({ a: 5 })).toBe(true);
  });

  it('map', () => {
    expect($object({ a: $number() }).map({ a: 5 })).toEqual({ a: 5 });
    expect(
      $object({ a: $number() })
        .thenMap((v) => v.a)
        .map({ a: 3 }),
    ).toBe(3);
  });
});
