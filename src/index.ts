// export { array } from './array';
// export { boolean } from './boolean';
// export { custom } from './custom';
// export { number } from './number';
// export { object } from './object';
// export { string } from './string';
// export { unknown } from './unknown';

/**
 * Given a schema `S`, this utility type determines the plain type of `S`.
 *
 * @example
 * const schema = number();
 * type SchemaType = GetTypeFromSchema<typeof schema>;
 * // SchemaType = number
 *
 * @example
 * const schema = object({
 *   x: number(),
 *   y: number({ eq: 1 as const }),
 * });
 * type SchemaType = GetTypeFromSchema<typeof schema>;
 * // SchemaType = { x: number, y: 1 }
 */
export type GetTypeFromSchema<S> = S extends Schema<infer T, unknown>
  ? T
  : never;

/**
 * Given a schema `S`, this utility type determines the mapped type of `S`.
 *
 * @example
 * const schema = number().withMapper(v => String(v));
 * type MappedSchemaType = GetTypeFromMappedSchema<typeof schema>;
 * // MappedSchemaType = string
 */
export type GetTypeFromMappedSchema<S> = S extends Schema<unknown, unknown, infer V>
  ? V
  : never;

// TS2545: A mixin class must have a constructor with a single rest parameter
// of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

type ValidateArg<S> = S extends Constructor<{ validate(v: infer T): boolean }> ? T : never;

export function WithValidator<S extends Constructor<{ validate(v: unknown): boolean }>>(Schema: S, fn: (v: ValidateArg<S>) => boolean): S {
  return class extends Schema {
    validate(v: ValidateArg<S>): boolean {
      return super.validate(v) && fn(v);
    }
  };
}

type IsTypeArg<S> = S extends Constructor<{ isType(v: unknown): v is infer T }> ? T : never;

export function WithIsType<S extends Constructor<{ isType(v: unknown): v is unknown }>>(Schema: S, fn: (v: unknown) => v is IsTypeArg<S>): S {
  return class extends Schema {
    isType(v: unknown): v is IsTypeArg<S> {
      return super.isType(v) && fn(v);
    }
  };
}

export function IdentityMap<S extends Constructor<{ map(v: T): T }>, T>(Schema: S): S {
  return class extends Schema {
    map(v: T): T {
      return v;
    }
  };
}

/**
 * A schema describes a type and can determine whether an unknown value matches
 * that type. It is also able to map from a type that fits this scheme into a
 * brand new type `U`.
 */
export abstract class Schema<T, U = T, V = U> {
  /**
   * Determines whether `v` is the type of this schema. The job of this function
   * is two-fold: first to check that the underlying types are the same (for
   * example, that a value has a type of 'string' for the `string()` schema);
   * second, to check the validity of that value (for example, checking that a
   * string has at least 3 characters for the `string({ minLength: 3 })`
   * schema).
   *
   * @param v
   */
  abstract isType(v: unknown): v is T;

  abstract validate(v: U): boolean;

  thenValidate(fn: (v: U) => boolean): Schema<T, U, V> {
    const { isType, validate, map } = this;
    return new (class extends Schema<T, U, V> {
      isType(v: unknown): v is T {
        return isType(v);
      }

      validate(v: U): boolean {
        return validate(v) && fn(v);
      }

      map(v: U): V {
        return map(v);
      }
    })
  }

  /**
   * Maps from the type that this schema describes (for example, a string for
   * the `string()` schema) into something else. The mapping function that this
   * function calls can be changed with {@link Schema.withMapper}.
   *
   * @example
   * const add1 = number().withMapper(v => v + 1);
   * add1.map(5); // 6
   *
   * @example Chaining
   * const add1 = number().withMapper(v => v + 1).withMapper(v => v * 2);
   * add1.map(5); // 12
   *
   * @param v
   */
  abstract map(v: U): V;

  thenMap<W>(fn: (v: V) => W): Schema<T, U, W> {
    const { isType, validate, map } = this;
    return new (class extends Schema<T, U, W> {
      isType(v: unknown): v is T {
        return isType(v);
      }

      validate(v: U): boolean {
        return validate(v);
      }

      map(v: U): W {
        return fn(map(v));
      }
    })
  }

  /**
   * A convenience function for checking the type of `v` with
   * {@link Schema.isType} and then, if that succeeds, mapping `v` using this
   * schema's mapper function via {@link Schema.map}. If `v` is not the correct
   * type, then `undefined` is returned.
   *
   * @example
   * const schema = string().withMapper(v => v.trim());
   * schema.isTypeAndMap(' hello '); // 'hello'
   * schema.isTypeAndMap(123);       // undefined
   *
   * @param v
   */
  // isTypeAndMap(v: unknown): U | undefined {
  //   if (this.isType(v)) {
  //     return this.map(v);
  //   }
  // }

  /**
   * Returns a new schema where the given function is called after
   * {@link this.isType} to check the validity of a value `v`. The function is
   * not called if a previous `isType` returns `false`.
   *
   * @example
   * const over5 = number().withIsType(v => v > 5);
   * over5.isType(3); // false
   * over5.isType(6); // true
   *
   * @example AND logic
   * const between5and10 = number()
   *   .withIsType(v => v >= 5)
   *   .withIsType(v => v <= 10);
   * over5.isType(3); // false
   * over5.isType(7); // true
   *
   * @param fn
   */
  // withIsType(fn: (v: T) => boolean): Schema<T, U> {
  //   const { isType, map } = this;
  //   return new (class extends Schema<T, U> {
  //     isType(v: unknown): v is T {
  //       return isType(v) && fn(v);
  //     }
  //
  //     map(v: T): U {
  //       return map(v);
  //     }
  //   })();
  // }

  /**
   * Returns a new schema where the given function is called after
   * {@link this.map} to map a value `v` to a new value.
   *
   * @example
   * const schema = string().withMapper(v => v.trim());
   * schema.map(' a  '); // 'a'
   *
   * @example Changing types
   * const schema = string().withMapper(v => Number(v) + 1);
   * schema.map('3'); // 4
   *
   * @param fn
   *
   * @see Schema.map
   */
  // withMapper<V>(fn: (v: U) => V): Schema<T, V> {
  //   const { isType, map } = this;
  //   return new (class extends Schema<T, V> {
  //     isType(v: unknown): v is T {
  //       return isType(v);
  //     }
  //
  //     map(v: T): V {
  //       return fn(map(v));
  //     }
  //   })();
  // }

  /**
   * Returns a new schema where values are allowed to be optional, or
   * `undefined`. Note that if the value is `undefined`, mapping functions that
   * come before this in the call chain will not receive that undefined value.
   *
   * @example
   * const schema = number().optional();
   * schema.isType(5);         // true
   * schema.isType(undefined); // true
   *
   * @example
   * const schema = number().withMapper(v => v + 1).optional();
   * schema.map(5); // 6
   * schema.map(undefined); // undefined
   */
  // optional(): Schema<T | undefined, U | undefined> {
  //   const { isType, map } = this;
  //   return new (class extends Schema<T | undefined, U | undefined> {
  //     isType(v: unknown): v is T | undefined {
  //       return v === undefined || isType(v);
  //     }
  //
  //     map(v: T | undefined): U | undefined {
  //       return v === undefined ? undefined : map(v);
  //     }
  //   })();
  // }

  /**
   * Returns a new schema where values are allowed to be `null`. Note that if
   * the value is `null`, mapping functions that come before this in the call
   * chain will not receive that null value.
   *
   * @example
   * const schema = number().nullable();
   * schema.isType(5);         // true
   * schema.isType(null); // true
   *
   * @example
   * const schema = number().withMapper(v => v + 1).nullable();
   * schema.map(5); // 6
   * schema.map(null); // null
   */
  // nullable(): Schema<T | null, U | null> {
  //   const { isType, map } = this;
  //   return new (class extends Schema<T | null, U | null> {
  //     isType(v: unknown): v is T | null {
  //       return v === null || isType(v);
  //     }
  //
  //     map(v: T | null): U | null {
  //       return v === null ? null : map(v);
  //     }
  //   })();
  // }

  /**
   * Returns a new schema where values are allowed to be this schema type OR
   * argument `schema`.
   *
   * @example
   * const schema = number().or(string());
   * schema.isType(5);    // true
   * schema.isType('a');  // true
   *
   * @example Using withMapper
   * const schema = number().withMapper(v => String(v + 1))
   *   .or(string().withMapper(v => v.trim()));
   * schema.map(5);        // '6'
   * schema.isType('  a'); // 'a'
   */
  // or<S extends Schema<unknown, V>, V>(
  //   schema: S,
  // ): Schema<T | GetTypeFromSchema<S>, U | V> {
  //   const { isType, map } = this;
  //   return new (class extends Schema<T | GetTypeFromSchema<S>, U | V> {
  //     isType(v: unknown): v is T | GetTypeFromSchema<S> {
  //       return isType(v) || schema.isType(v);
  //     }
  //
  //     map<S>(v: GetTypeFromSchema<S> | T): U | V {
  //       return isType(v) ? map(v) : schema.map(v);
  //     }
  //   })();
  // }
}

export abstract class UnmappedSchema<T> extends Schema<T> {
  map(v: T): T {
    return v;
  }
}

export type SchemaRecord = Record<PropertyKey, Schema<unknown>>;

export type GetTypeFromSchemaRecord<S extends SchemaRecord> = {
  [K in keyof S]: GetTypeFromSchema<S[K]>;
};

export type GetTypeFromMappedSchemaRecord<S extends SchemaRecord> = {
  [K in keyof S]: GetTypeFromMappedSchema<S[K]>;
};

export abstract class ObjectSchema<S extends SchemaRecord> extends Schema<
  GetTypeFromSchemaRecord<S>,
  GetTypeFromMappedSchemaRecord<S>
> {
  /**
   * Returns a new schema where all values may be `undefined`.
   *
   * @example
   * const schema = object({
   *   a: number(),
   *   b: number(),
   * }).partial();
   * schema.isType({ a: 1, b: 2 });         // true
   * schema.isType({ a: undefined, b: 2 }); // true
   * schema.isType(undefined);              // false
   *
   * @example Using withMapper
   * const schema = object({
   *   a: number().withMapper(v => v + 1),
   *   b: number(),
   * }).partial().withMapper(v => v.a);
   * schema.map({ a: 1, b: 3 });         // 2
   * schema.map({ a: undefined, b: 2 }); // undefined
   */
  abstract partial(): Schema<
    Partial<GetTypeFromSchemaRecord<S>>,
    Partial<GetTypeFromMappedSchemaRecord<S>>
  >;
}
