import { GetSchemaMappedType, GetSchemaType, Schema } from './schema';
import { $undefined } from './undefined';

export type SchemaRecord = Record<PropertyKey, Schema<unknown>>;

export type GetPartialSchemaRecord<S extends SchemaRecord> = {
  [K in keyof S]: Schema<
    GetSchemaType<S[K]> | undefined,
    GetSchemaMappedType<S[K]> | undefined
  >;
};

export type GetSchemaRecordType<S extends SchemaRecord> = {
  [K in keyof S as undefined extends GetSchemaType<S[K]>
    ? never
    : K]: GetSchemaType<S[K]>;
} & {
  [K in keyof S as undefined extends GetSchemaType<S[K]>
    ? K
    : never]?: GetSchemaType<S[K]>;
};

export type GetSchemaRecordMappedType<S extends SchemaRecord> = {
  [K in keyof S as undefined extends GetSchemaMappedType<S[K]>
    ? never
    : K]: GetSchemaMappedType<S[K]>;
} & {
  [K in keyof S as undefined extends GetSchemaMappedType<S[K]>
    ? K
    : never]?: GetSchemaMappedType<S[K]>;
};

export class ObjectSchema<S extends SchemaRecord> extends Schema<
  GetSchemaRecordType<S>,
  GetSchemaRecordMappedType<S>
> {
  protected readonly schema: S;

  constructor(schema: S) {
    super();
    this.schema = schema;
  }

  override isType(vs: unknown): vs is GetSchemaRecordType<S> {
    return (
      typeof vs === 'object' &&
      vs !== null &&
      Object.entries(this.schema).every(([k, v]) =>
        v.isType((vs as Record<PropertyKey, unknown>)[k]),
      )
    );
  }

  override isValid(vs: GetSchemaRecordType<S>): boolean {
    return Object.entries(this.schema).every(([k, v]) =>
      v.isValid(vs[k as keyof typeof vs]),
    );
  }

  override map(vs: GetSchemaRecordType<S>): GetSchemaRecordMappedType<S> {
    return Object.fromEntries(
      Object.entries(this.schema).map(([k, v]) => [
        k,
        v.map(vs[k as keyof typeof vs]),
      ]),
    ) as GetSchemaRecordMappedType<S>;
  }
}

export class ExactObjectSchema<S extends SchemaRecord> extends ObjectSchema<S> {
  /**
   * Validates that objects don't any properties that aren't specified in this
   * schema.
   *
   * Combining `noExcess()` with `partial()` (in any order) will validate that
   * objects do not have _excess_ properties; but, of the known properties, any
   * or all of their values may be missing or `undefined`.
   *
   * @example
   * $object({ a: $number() })
   *   .isType({ a: 1, b: 2 }); // true
   *
   * $object({ a: $number() })
   *   .noExcess()
   *   .isType({ a: 1, b: 2 }); // false
   *
   * $object({ 0: $number() }).isType([1]);            // true
   * $object({ 0: $number() }).noExcess().isType([1]); // false
   *
   * const schema = $object({ a: $number() }).noExcess().partial();
   * schema.isType({});               // true
   * schema.isType({ a: 1 });         // true
   * schema.isType({ a: 1, b: 'c' }); // false
   * schema.isType({ b: 'c' });       // false
   */
  noExcess(): ExactObjectSchema<S> {
    return new (class NoExcessObjectSchema<
      S extends SchemaRecord,
    > extends ExactObjectSchema<S> {
      override isType(vs: unknown): vs is GetSchemaRecordType<S> {
        return (
          super.isType(vs) &&
          !Array.isArray(vs) &&
          Object.keys(vs).every((k) => k in this.schema)
        );
      }

      override partial(): ExactObjectSchema<GetPartialSchemaRecord<S>> {
        return super.partial().noExcess();
      }
    })(this.schema);
  }

  /**
   * Makes all schema values in this schema optional.
   *
   * Combining `noExcess()` with `partial()` (in any order) will validate that
   * objects do not have _excess_ properties; but, of the known properties, any
   * or all of their values may be missing or `undefined`.
   *
   * @example
   * $object({ a: $number })
   *   .partial()
   *   .isType({}); // true
   *
   * $object({ a: $number })
   *   .partial()
   *   .isType({ a: 2 }); // true
   *
   * $object({ a: $number })
   *   .partial()
   *   .isType({ a: undefined, b: 'c' }); // true
   *
   * const schema = $object({ a: $number() }).noExcess().partial();
   * schema.isType({});               // true
   * schema.isType({ a: 1 });         // true
   * schema.isType({ a: 1, b: 'c' }); // false
   * schema.isType({ b: 'c' });       // false
   */
  partial(): ExactObjectSchema<GetPartialSchemaRecord<S>> {
    return new ExactObjectSchema<GetPartialSchemaRecord<S>>(
      Object.fromEntries(
        Object.entries(this.schema).map(([k, v]) => [k, v.or($undefined())]),
      ) as GetPartialSchemaRecord<S>,
    );
  }
}

type EmptyObject = Record<PropertyKey, never>;

export function $object(schema: EmptyObject): ExactObjectSchema<EmptyObject>;

export function $object<S extends SchemaRecord>(
  schema: S,
): ExactObjectSchema<S>;

/**
 * Creates an object schema.
 * @param schema A record of keys to their schemas.
 *
 * @example Simple object
 * $object({ a: $string(), b: $number() })
 *   .isType({ a: '123', b: 456 }); // true
 *
 * $object({ a: $string() })
 *   .isType({ a: '123', b: 456 }); // true
 *
 * $object({ a: $string() })
 *   .isType({ b: 456 });           // false
 */
export function $object<S extends SchemaRecord>(
  schema: S,
): ExactObjectSchema<S> {
  return new ExactObjectSchema<S>(schema);
}
