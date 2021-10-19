import { BaseSchema, Schema } from './schema';

export class UndefinedSchema extends BaseSchema<undefined> {
  override isType(v: unknown): v is undefined {
    return Object.is(v, undefined);
  }
}

/**
 * Creates an `undefined` schema.
 *
 * @example
 * $undefined().isType(undefined); // true
 * $undefined().isType(0);         // false
 */
export function $undefined(): Schema<undefined> {
  return new UndefinedSchema();
}
