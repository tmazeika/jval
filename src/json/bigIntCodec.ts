import { $string } from '..';
import { TypeCodec } from './index';

/**
 * Supports BigInt types.
 */
export const bigIntCodec: TypeCodec<BigInt, string> = {
  schema: $string().thenMap((v) => BigInt(v)),
  isType: (v): v is BigInt => typeof v === 'bigint',
  unwrap: (v) => v.toString(),
};
