import { BaseSchema, Schema } from './schema';

/**
 * Creates an `unknown` schema.
 *
 * @example
 * $unknown().isType(1);   // true
 * $unknown().isType('a'); // true
 */
export function $unknown(): Schema<unknown> {
  return new BaseSchema<unknown>();
}
