import { BaseSchema, Schema, WithValidator } from './schema';

export class NumberSchema extends BaseSchema<number> {
  override isType(v: unknown): v is number {
    return typeof v === 'number';
  }
}

export class AnyNumberSchema extends NumberSchema {
  /**
   * Validates that numbers are at least `n`.
   */
  min(n: number): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, (v: number) => v >= n))();
  }

  /**
   * Validates that numbers are at most `n`.
   */
  max(n: number): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, (v: number) => v <= n))();
  }

  /**
   * Validates that numbers are safe integers.
   *
   * @see Number.isSafeInteger
   */
  int(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isSafeInteger))();
  }

  /**
   * Validates that numbers are integers (not necessarily _safe_ integers).
   *
   * @see Number.isInteger
   */
  unsafeInt(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isInteger))();
  }

  /**
   * Validates that numbers are finite (which also implies not `NaN`).
   *
   * @see Number.isFinite
   */
  finite(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isFinite))();
  }
}

export class ExactNumberSchema extends AnyNumberSchema {
  /**
   * Validates that numbers equal one element of `ns`.
   */
  eq<N extends number>(...ns: N[]): Schema<N> {
    return new (class extends BaseSchema<N> {
      override isType(v: unknown): v is N {
        return ns.some((n) => Object.is(v, n));
      }
    })();
  }
}

/**
 * Creates a number schema.
 *
 * @example
 * $number().isType(1);                        // true
 * $number().isType(3.14);                     // true
 * $number().isType(Number.POSITIVE_INFINITY); // true
 * $number().isType(Number.NaN);               // true
 */
export function $number(): ExactNumberSchema {
  return new ExactNumberSchema();
}
