import { $array, $tuple, $unknown } from '../schema';
import { TypeCodec } from './codec';

/**
 * Supports ES6 Map types.
 */
export const mapCodec: TypeCodec<
  Map<unknown, unknown>,
  [unknown, unknown][]
> = {
  schema: $array($tuple($unknown(), $unknown())).thenMap((v) => new Map(v)),
  isType: (v): v is Map<unknown, unknown> => v instanceof Map,
  unwrap: (v) => Array.from(v.entries()),
};
