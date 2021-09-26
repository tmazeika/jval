import { Schema } from '.';

/**
 * A value schema for a boolean.
 */
export function boolean(): Schema<boolean> {
  return new (class extends Schema<boolean> {
    isType(v: unknown): v is boolean {
      return typeof v === 'boolean';
    }

    map(v: boolean): boolean {
      return v;
    }
  })();
}
