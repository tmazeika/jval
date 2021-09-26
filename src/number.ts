import { Schema } from '.';

interface Options {
  /**
   * When set, requires that the number be exactly equal to this value. If this
   * is a constant, the type of the number becomes the constant.
   *
   * @example Constant
   * const mustBe1 = number({ eq: 1 as const });
   * const data: unknown = 1;
   * if (mustBe1.isType(data)) {
   *   const v: 1 = data; // typechecks
   *   // ...
   * }
   */
  eq?: number;

  /**
   * The minimum value of the number, inclusive. By default, there is no
   * minimum value.
   */
  min?: number;

  /**
   * The maximum value of the number, inclusive. By default, there is no
   * maximum value.
   */
  max?: number;

  /**
   * When `true`, requires that the number be a _safe integer_.
   * @see Number.isSafeInteger
   */
  integer?: boolean;

  /**
   * When unset or `false`, the number is required to be finite. Otherwise, when
   * set to `true`, positive and negative infinity are allowed. Also note that
   * very large numbers may turn into infinity.
   *
   * @example Large numbers may turn into infinity
   * const n = Number('9'.repeat(400)); // Infinity
   * number().isType(n);    // false
   * number().isType(9999); // true
   *
   * @see Number.isFinite
   */
  allowInfinite?: boolean;
}

type NarrowedNumber<O extends Options> = O['eq'] extends number
  ? O['eq']
  : number;

/**
 * Creates a value schema for a number.
 *
 * @param options
 */
export function number<O extends Options>(
  options: O,
): Schema<NarrowedNumber<O>>;

/**
 * Creates a value schema for a number.
 *
 * @param options
 */
export function number(options?: Options): Schema<number>;

/**
 * Creates a value schema for a number.
 *
 * @param options
 */
export function number(options?: Options): Schema<number> {
  return new (class extends Schema<number> {
    isType(v: unknown): v is number {
      if (typeof v !== 'number' || Number.isNaN(v)) {
        return false;
      }
      let ok = options?.eq === undefined || v === options.eq;
      ok &&= options?.min === undefined || v >= options.min;
      ok &&= options?.max === undefined || v <= options.max;
      ok &&= !options?.integer || Number.isSafeInteger(v);
      ok &&= options?.allowInfinite || Number.isFinite(v);
      return ok;
    }

    map(v: number): number {
      return v;
    }
  })();
}
