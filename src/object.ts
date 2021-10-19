import { GetSchemaMappedType, GetSchemaType, Schema } from './schema';

export type SchemaRecord = Record<PropertyKey, Schema<unknown>>;

export type GetSchemaRecordType<S extends SchemaRecord> = {
  [K in keyof S]: GetSchemaType<S[K]>;
};

export type GetSchemaRecordMappedType<S extends SchemaRecord> = {
  [K in keyof S]: GetSchemaMappedType<S[K]>;
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
    return Object.entries(this.schema).every(([k, v]) => v.isValid(vs[k]));
  }

  override map(vs: GetSchemaRecordType<S>): GetSchemaRecordMappedType<S> {
    return Object.fromEntries(
      Object.entries(this.schema).map(([k, v]) => [k, v.map(vs[k])]),
    ) as GetSchemaRecordMappedType<S>;
  }
}

export class ExactObjectSchema<S extends SchemaRecord> extends ObjectSchema<S> {
  /**
   * Validates that objects strictly match the object schema without excess
   * properties.
   *
   * @example
   * $object({ a: $number })
   *   .isType({ a: 1, b: 2 }); // true
   *
   * $object({ a: $number })
   *   .strict()
   *   .isType({ a: 1, b: 2 }); // false
   *
   * $object({ 0: $number() }).isType([1]);          // true
   * $object({ 0: $number() }).strict().isType([1]); // false
   */
  strict(): Schema<GetSchemaRecordType<S>, GetSchemaRecordMappedType<S>> {
    return new (class extends ObjectSchema<S> {
      override isType(vs: unknown): vs is GetSchemaRecordType<S> {
        return (
          super.isType(vs) &&
          !Array.isArray(vs) &&
          Object.keys(vs).length === Object.keys(this.schema).length
        );
      }
    })(this.schema);
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
