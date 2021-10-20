import { BaseSchema, Schema, WithValidator } from './schema';

export class StringSchema extends BaseSchema<string> {
  override isType(v: unknown): v is string {
    return typeof v === 'string';
  }
}

export class AnyStringSchema extends StringSchema {
  /**
   * Validates that strings have a length of at least `n`.
   *
   * @see String.length
   */
  minLength(n: number): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) => v.length >= n))();
  }

  /**
   * Validates that strings have a length of at most `n`.
   *
   * @see String.length
   */
  maxLength(n: number): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) => v.length <= n))();
  }

  /**
   * Validates that strings have a length equal to `n`.
   *
   * @see String.length
   */
  length(n: number): AnyStringSchema {
    return new (WithValidator(
      AnyStringSchema,
      (v: string) => v.length === n,
    ))();
  }

  /**
   * Validates that strings match the given regular expression.
   *
   * @see RegExp.test
   */
  regExp(regExp: RegExp): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) =>
      regExp.test(v),
    ))();
  }
}

export class ExactStringSchema extends AnyStringSchema {
  /**
   * Validates that strings equal one element of `ss`.
   */
  eq<S extends string>(...ss: S[]): Schema<S> {
    return new (class extends BaseSchema<S> {
      override isType(v: unknown): v is S {
        return ss.some((s) => Object.is(v, s));
      }
    })();
  }
}

/**
 * Creates a string schema.
 */
export function $string(): ExactStringSchema {
  return new ExactStringSchema();
}
