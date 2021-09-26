import { Schema } from '.';

/**
 * Creates a value schema for any type.
 */
export function unknown(): Schema<unknown> {
  return new (class extends Schema<unknown> {
    isType(v: unknown): v is unknown {
      return true;
    }

    map(v: unknown): unknown {
      return v;
    }
  })();
}
