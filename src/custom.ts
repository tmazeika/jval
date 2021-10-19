import { BaseSchema, Schema } from './schema';

/**
 * Creates a custom type schema.
 * @param typeChecker Checks that `v` is of the desired type.
 *
 * @example Custom Date schema
 * $custom((v): v is Date => v instanceof Date).isType(new Date()); // true
 */
export function $custom<T>(typeChecker: (v: unknown) => v is T): Schema<T> {
  return new (class extends BaseSchema<T> {
    override isType = typeChecker;
  })();
}
