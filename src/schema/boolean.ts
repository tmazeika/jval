import { BaseSchema, Schema } from './schema';

export class BooleanSchema extends BaseSchema<boolean> {
  override isType(v: unknown): v is boolean {
    return typeof v === 'boolean';
  }
}

export class ExactBooleanSchema extends BooleanSchema {
  /**
   * Validates that booleans equal `b`.
   */
  eq<B extends boolean>(b: B): Schema<B> {
    return new (class extends BaseSchema<B> {
      override isType(v: unknown): v is B {
        return Object.is(v, b);
      }
    })();
  }
}

/**
 * Creates a boolean schema.
 */
export function $boolean(): ExactBooleanSchema {
  return new ExactBooleanSchema();
}
