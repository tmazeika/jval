import { $array, $unknown } from '../schema';
import { TypeCodec } from './codec';

/**
 * Supports ES6 Set types.
 */
export const setCodec: TypeCodec<Set<unknown>, unknown[]> = {
  schema: $array($unknown()).thenMap((v) => new Set(v)),
  isType: (v): v is Set<unknown> => v instanceof Set,
  unwrap: (v) => Array.from(v.values()),
};
