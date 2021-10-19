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

export function $object<S extends SchemaRecord>(
  schema: S,
): ExactObjectSchema<S> {
  return new ExactObjectSchema<S>(schema);
}
