import { $string } from '../schema';
import { TypeCodec } from './codec';

/**
 * Supports BigInt types.
 */
export const bigIntCodec: TypeCodec<BigInt, string> = {
  schema: $string().thenMap((v) => BigInt(v)),
  isType: (v): v is BigInt => typeof v === 'bigint',
  unwrap: (v) => v.toString(),
};
