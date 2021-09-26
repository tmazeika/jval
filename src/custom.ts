import { Schema } from '.';

/**
 * Creates a value schema for a custom type.
 *
 * @param isType A function that returns `v` as the desired type when `v` is
 *   that type and is valid. If `v` is not that type or is invalid, it should
 *   return `undefined`.
 *
 * @example A value schema for a Map
 * const map = custom(v => v instanceof Map ? v : undefined);
 * map.isType(new Map([['a', 1], ['b', 2]])); // true
 * map.isType({ a: 1, b: 2 });                // false
 *
 * @example A value schema for a number greater than 1,000,000
 * const largeNumber = custom(v => typeof v === 'number' && v > 1_000_000 ? v :
 *   undefined); largeNumber.isType(2_500_000); // true
 *   largeNumber.isType(300);       // false
 */
export function custom<T>(isType: (v: unknown) => T | undefined): Schema<T> {
  return new (class extends Schema<T> {
    isType(v: unknown): v is T {
      return isType(v) !== undefined;
    }

    map(v: T): T {
      return v;
    }
  })();
}
