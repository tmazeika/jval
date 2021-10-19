import { BaseSchema, Schema } from './schema';

export function $custom<T>(typeChecker: (v: unknown) => v is T): Schema<T> {
  return new (class extends BaseSchema<T> {
    override isType = typeChecker;
  })();
}
