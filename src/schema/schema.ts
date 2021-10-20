interface ValidatorAndMapper<T, U = T> {
  isValid(v: T): boolean;

  map(v: T): U;
}

/**
 * Represents a schema for primitive and compound types.
 */
export abstract class Schema<T, U = T> implements ValidatorAndMapper<T, U> {
  /**
   * Checks that an unknown value `v` is the same type that this schema
   * describes.
   *
   * The value is not necessarily validated after this function
   * returns. For example, a string's length may not be checked. With that said,
   * some validation functions _are_ run in order to narrow certain types. For
   * instance, an array's length may be checked for tuple schemas.
   *
   * It remains unspecified what schemas are type-checked _and_ validated at
   * this stage. It is only when `isValid` is called that a value `v` is
   * guaranteed to be of the correct type and fully valid.
   *
   * @example
   * $string().minLength(3).isType('ab');       // true
   * $tuple($string, $number).isType(['a', 1]); // true
   * $tuple($string, $number).isType(['a']);    // false
   *
   * const v: unknown = 123.45;
   * if ($number().isType(v)) {
   *   const n: number = v; // this type-checks
   * }
   */
  abstract isType(v: unknown): v is T;

  /**
   * Checks that a value `v` is valid as described by this schema.
   *
   * @example
   * $number().finite().isValid(1);        // true
   * $number().int().isValid(3.14);        // false
   * $string().minLength(3).isValid('ab'); // false
   */
  abstract isValid(v: T): boolean;

  /**
   * Creates a new schema that wraps this schema but modifies the `isValid`
   * behavior. When `isValid(v)` is called on the new schema, it will run
   * `isValid(v)` on this schema, and then, if validation passed, run
   * `validator(v)`. This implies that validation may short-circuit, so
   * `validator(v)` may not be called.
   *
   * @example
   * $string().thenValidate(v => v.trim().length === 3).isValid(' 123'); // true
   *
   * $number()
   *   .thenValidate(v => v > 3)
   *   .thenValidate(() => throw 'error')
   *   .isValid(2); // false
   */
  thenValidate(validator: (v: U) => boolean): Schema<T, U> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T, U> {
      override isType = isType;
      override map = map;

      override isValid(v: T): boolean {
        return isValid(v) && validator(map(v));
      }
    })();
  }

  /**
   * Maps a value `v` of type `T` to a value of type `U`, as defined by the
   * applied mapping functions to get to this schema.
   *
   * @example
   * $string()
   *   .map('a'); // 'a'
   *
   * $string()
   *   .thenMap(v => v + 'c')
   *   .map('b'); // 'bc'
   *
   * $string()
   *   .thenMap(v => v + 'c')
   *   .thenMap(v => v + 'd')
   *   .map('b'); // 'bcd'
   *
   * $number()
   *   .thenMap(v => String(v))
   *   .thenMap(v => v.length)
   *   .map(123); // 3
   *
   * @see thenMap
   */
  abstract map(v: T): U;

  /**
   * Creates a new schema that wraps this schema but modifies the `map`
   * behavior. When `map(t)` is called on the new schema, it will run `map(t)`
   * on this schema, and then run `mapper(u)` where `u` is the result of
   * `map(t)`.
   *
   * @see map
   */
  thenMap<V>(mapper: (v: U) => V): Schema<T, V> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T, V> {
      override isType = isType;
      override isValid = isValid;

      override map(v: T): V {
        return mapper(map(v));
      }
    })();
  }

  /**
   * Creates a new schema that represents the union type of this schema and the
   * given schema.
   *
   * Mapping and validation still work: for both functions, the
   * passed value `v`'s type is checked against this schema or the other,
   * prioritizing this schema if `v` is correct for both (think
   * `$string().or($string())`). The mapping or validation then branches off:
   * if `v` is described by this schema, then this schema's mapping and
   * validation is performed on `v`, otherwise the other schema's mapping and
   * validation is done.
   *
   * @example
   * $number().or($string()).isType(1);    // true
   * $number().or($string()).isType('a');  // true
   * $number().or($string()).isType(true); // false
   *
   * $string().or($null()).isType(null); // true
   *
   * $string().thenMap(v => v + 'a')
   *   .or($string().thenMap(v => v + 'b'))
   *   .map('c'); // 'ca'
   */
  or<S extends Schema<V, W>, V = GetSchemaType<S>, W = GetSchemaMappedType<S>>(
    schema: S,
  ): Schema<T | V, U | W> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T | V, U | W> {
      override isType(v: unknown): v is T | V {
        return isType(v) || schema.isType(v);
      }

      override isValid(v: T | V): boolean {
        return isType(v) ? isValid(v) : schema.isValid(v);
      }

      override map(v: T | V): U | W {
        return isType(v) ? map(v) : schema.map(v);
      }
    })();
  }
}

export class BaseSchema<T> extends Schema<T> {
  override isType(v: unknown): v is T {
    return true;
  }

  // This method is meant to be overridden, otherwise no real validation occurs.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override isValid(v: T): boolean {
    return true;
  }

  override map(v: T): T {
    return v;
  }
}

/**
 * Gets the base type of a schema.
 *
 * @example
 * type N = GetSchemaType<ReturnType<typeof $number>> // number
 *
 * const obj = $object({
 *   a: $number().thenMap(v => String(v)),
 *   b: $string(),
 * });
 * type O = GetSchemaType<typeof obj> // { a: number, b: string }
 */
export type GetSchemaType<S> = S extends Schema<infer T, unknown> ? T : never;

/**
 * Gets the mapped type of a schema.
 *
 * @example
 * type N = GetSchemaMappedType<ReturnType<typeof $number>> // number
 *
 * const obj = $object({
 *   a: $number().thenMap(v => String(v)),
 *   b: $string(),
 * });
 * type O = GetSchemaMappedType<typeof obj> // { a: string, b: string }
 */
export type GetSchemaMappedType<S> = S extends Schema<unknown, infer U>
  ? U
  : never;

// TS2545: A mixin class must have a constructor with a single rest parameter
// of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

type GetSchemaCtorType<S> = S extends Constructor<
  ValidatorAndMapper<infer T, unknown>
>
  ? T
  : never;
type GetSchemaCtorMappedType<S> = S extends Constructor<
  ValidatorAndMapper<unknown, infer U>
>
  ? U
  : never;

export const WithValidator = <
  S extends Constructor<ValidatorAndMapper<T, U>>,
  T = GetSchemaCtorType<S>,
  U = GetSchemaCtorMappedType<S>,
>(
  Schema: S,
  validator: (v: U) => boolean,
): S =>
  class extends Schema {
    override isValid(v: T): boolean {
      return super.isValid(v) && validator(super.map(v));
    }
  };
