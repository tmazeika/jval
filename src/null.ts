import { BaseSchema } from './schema';

export class NullSchema extends BaseSchema<null> {
  override isType(v: unknown): v is null {
    return Object.is(v, null);
  }
}

/**
 * Creates a `null` schema.
 *
 * @example
 * $null().isType(null); // true
 * $null().isType(0);    // false
 */
export function $null(): BaseSchema<null> {
  return new NullSchema();
}
