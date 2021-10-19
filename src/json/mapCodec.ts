import { $array, $tuple, $unknown } from '..';
import { TypeCodec } from './index';

/**
 * Supports ES6 Map types.
 */
export const mapCodec: TypeCodec<Map<unknown, unknown>,
  [unknown, unknown][]
> = {
  schema: $array($tuple($unknown(), $unknown())).thenMap((v) => new Map(v)),
  isType: (v): v is Map<unknown, unknown> => v instanceof Map,
  unwrap: (v) => Array.from(v.entries()),
};
