import { BaseSchema } from './schema';

export class NullSchema extends BaseSchema<null> {
  override isType(v: unknown): v is null {
    return Object.is(v, null);
  }
}

export function $null(): NullSchema {
  return new NullSchema();
}
