import {
  GetTypeFromMappedSchemaRecord,
  GetTypeFromSchemaRecord,
  ObjectSchema,
  Schema,
  SchemaRecord,
} from '.';

interface Options {
  /**
   * When an object is passed to this schema's `map` function, properties in
   * that object that are not defined in the schema are normally stripped away.
   * Set this to `true` to turn off that behavior.
   */
  includeUnknowns?: boolean;
}

/**
 * Creates a value schema for an object.
 *
 * @param schema The schema for each of an object's properties.
 * @param options
 */
export function object<S extends SchemaRecord>(
  schema: S,
  options?: Options,
): ObjectSchema<S> {
  return new (class extends ObjectSchema<S> {
    isType(v: unknown): v is GetTypeFromSchemaRecord<S> {
      if (typeof v !== 'object' || v === null) {
        return false;
      }
      return Object.entries(schema).every(([k, s]) =>
        s.isType(v[k as keyof typeof v]),
      );
    }

    map(v: GetTypeFromSchemaRecord<S>): GetTypeFromMappedSchemaRecord<S> {
      const transformed = Object.fromEntries(
        Object.entries(schema).map(([k, s]) => [
          k,
          s.map(v[k as keyof typeof v]),
        ]),
      );
      return (
        options?.includeUnknowns ? { ...v, ...transformed } : transformed
      ) as GetTypeFromMappedSchemaRecord<S>;
    }

    partial(): Schema<
      Partial<GetTypeFromSchemaRecord<S>>,
      Partial<GetTypeFromMappedSchemaRecord<S>>
    > {
      return new (class extends Schema<
        Partial<GetTypeFromSchemaRecord<S>>,
        Partial<GetTypeFromMappedSchemaRecord<S>>
      > {
        isType(v: unknown): v is Partial<GetTypeFromSchemaRecord<S>> {
          if (typeof v !== 'object' || v === null) {
            return false;
          }
          return Object.entries(schema).every(([k, s]) => {
            const vk = v[k as keyof typeof v];
            return vk === undefined ? true : s.isType(vk);
          });
        }

        map(
          v: Partial<GetTypeFromSchemaRecord<S>>,
        ): Partial<GetTypeFromMappedSchemaRecord<S>> {
          const transformed = Object.fromEntries(
            Object.entries(schema).map(([k, s]) => {
              const vk = v[k as keyof typeof v];
              return [k, vk === undefined ? undefined : s.map(vk)];
            }),
          );
          return (
            options?.includeUnknowns ? { ...v, ...transformed } : transformed
          ) as Partial<GetTypeFromMappedSchemaRecord<S>>;
        }
      })();
    }
  })();
}
