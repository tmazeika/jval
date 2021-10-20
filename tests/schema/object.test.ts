import { $boolean, $number, $object, $string } from '../../src/index';

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

  it('noExcess', () => {
    expect($object({ a: $number() }).noExcess().isType({ a: 3 })).toBe(true);
    expect($object({ a: $number() }).noExcess().isType({ a: 3, b: '3' })).toBe(
      false,
    );
    expect(
      $object({ a: $boolean(), b: $string() })
        .noExcess()
        .isType({ a: true, b: '' }),
    ).toBe(true);
    expect($object({}).noExcess().isType({})).toBe(true);
    expect($object({}).noExcess().isType([1, 'a'])).toBe(false);
    expect($object({}).noExcess().isType({ a: 1 })).toBe(false);
    expect($object({ a: $number() }).noExcess().isType({})).toBe(false);
    expect($object({ a: $number() }).noExcess().isType({ b: 1 })).toBe(false);
    expect(
      $object({ 0: $number(), 1: $string() }).noExcess().isType([1, 'a']),
    ).toBe(false);
    expect(
      $object({ 0: $number(), 2: $string() }).noExcess().isType([1, 'a']),
    ).toBe(false);
  });

  it('isValid', () => {
    expect($object({}).isValid({})).toBe(true);
    expect($object({ a: $number() }).isValid({ a: 5 })).toBe(true);
    expect($object({ a: $number() }).partial().isValid({})).toBe(true);
    expect($object({ a: $number() }).partial().noExcess().isValid({})).toBe(
      true,
    );
    expect($object({ a: $number() }).noExcess().partial().isValid({})).toBe(
      true,
    );
  });

  it('partial', () => {
    expect($object({}).partial().isType({})).toBe(true);
    expect($object({ a: $string() }).partial().isType({})).toBe(true);
    expect($object({ a: $string() }).partial().isType({ b: '2' })).toBe(true);
    expect($object({ a: $string() }).partial().isType({ a: '5', b: '2' })).toBe(
      true,
    );
    expect($object({ a: $string() }).partial().isType({ a: 1, b: '2' })).toBe(
      false,
    );
    expect($object({ a: $string() }).partial().isType({ a: 1 })).toBe(false);
    expect($object({ a: $string() }).partial().isType({ a: 'b' })).toBe(true);
  });

  it('noExcess & partial', () => {
    expect($object({}).partial().noExcess().isType({})).toBe(true);
    expect($object({}).noExcess().partial().isType({})).toBe(true);

    expect(
      $object({ a: $string() }).partial().noExcess().isType({ a: undefined }),
    ).toBe(true);
    expect(
      $object({ a: $string() }).noExcess().partial().isType({ a: undefined }),
    ).toBe(true);

    expect($object({ a: $string() }).partial().noExcess().isType({})).toBe(
      true,
    );
    expect($object({ a: $string() }).noExcess().partial().isType({})).toBe(
      true,
    );

    expect(
      $object({ a: $string() }).partial().noExcess().isType({ b: undefined }),
    ).toBe(false);
    expect(
      $object({ a: $string() }).noExcess().partial().isType({ b: undefined }),
    ).toBe(false);

    expect(
      $object({ a: $string() }).partial().noExcess().isType({ a: '1' }),
    ).toBe(true);
    expect(
      $object({ a: $string() }).noExcess().partial().isType({ a: '1' }),
    ).toBe(true);

    expect(
      $object({ a: $string() }).partial().noExcess().isType({ a: 1 }),
    ).toBe(false);
    expect(
      $object({ a: $string() }).noExcess().partial().isType({ a: 1 }),
    ).toBe(false);

    expect(
      $object({ a: $string() }).partial().noExcess().isType({ b: '2' }),
    ).toBe(false);
    expect(
      $object({ a: $string() }).noExcess().partial().isType({ b: '2' }),
    ).toBe(false);
  });

  it('map', () => {
    expect($object({ a: $number() }).noExcess().partial().map({})).toEqual({});
    expect($object({ a: $number() }).map({ a: 5 })).toEqual({ a: 5 });
    expect(
      $object({ a: $number() })
        .thenMap((v) => v.a)
        .map({ a: 3 }),
    ).toBe(3);
  });
});
