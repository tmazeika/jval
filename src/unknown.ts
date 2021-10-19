import { BaseSchema, Schema } from './schema';

export function $unknown(): Schema<unknown> {
  return new BaseSchema<unknown>();
}
