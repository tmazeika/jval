import { BaseSchema } from './schema';

export class UndefinedSchema extends BaseSchema<undefined> {
  override isType(v: unknown): v is undefined {
    return Object.is(v, undefined);
  }
}

export function $undefined(): UndefinedSchema {
  return new UndefinedSchema();
}
