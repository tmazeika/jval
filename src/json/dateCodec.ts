import { $string } from '../schema';
import { TypeCodec } from './codec';

/**
 * Supports JavaScript Date types.
 */
export const dateCodec: TypeCodec<Date, string> = {
  schema: $string().thenMap((v) => new Date(v)),
  isType: (v): v is Date => v instanceof Date,
  unwrap: (v) => v.toISOString(),
};
