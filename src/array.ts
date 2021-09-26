import { GetTypeFromMappedSchema, GetTypeFromSchema, Schema } from '.';

type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

interface Options {
  /**
   * When set, requires that the array be exactly this length. If this is a
   * constant, the type of the array becomes an n-tuple.
   *
   * @example Tuple
   * const xy = array({ length: 2 as const });
   * const arr: unknown = [1, 2];
   * if (xy.isType(arr)) {
   *   const posn: [number, number] = arr; // typechecks
   *   // ...
   * }
   */
  length?: number;

  /**
   * The minimum length of the array. By default, this is effectively 0.
   */
  minLength?: number;

  /**
   * The maximum length of the array. By default, there is no maximum length.
   */
  maxLength?: number;
}

type NarrowedArray<O extends Options, T> = O['length'] extends number
  ? Tuple<T, O['length']>
  : T[];

/**
 * A value schema for an array.
 *
 * @param schema The schema for each of an array's elements.
 * @param options
 */
export function array<S extends Schema<unknown>, O extends Options>(
  schema: S,
  options: O,
): Schema<
  NarrowedArray<O, GetTypeFromSchema<S>>,
  NarrowedArray<O, GetTypeFromMappedSchema<S>>
>;

/**
 * A value schema for an array.
 *
 * @param schema The schema for each of an array's elements.
 * @param options
 */
export function array<S extends Schema<unknown>>(
  schema: S,
  options?: Options,
): Schema<GetTypeFromSchema<S>[], GetTypeFromMappedSchema<S>[]>;

/**
 * A value schema for an array.
 *
 * @param schema The schema for each of an array's elements.
 * @param options
 */
export function array<S extends Schema<unknown, U>, U>(
  schema: S,
  options?: Options,
): Schema<GetTypeFromSchema<S>[], GetTypeFromMappedSchema<S>[]> {
  return new (class extends Schema<
    GetTypeFromSchema<S>[],
    GetTypeFromMappedSchema<S>[]
  > {
    isType(v: unknown): v is GetTypeFromSchema<S>[] {
      if (!Array.isArray(v)) {
        return false;
      }
      let ok = options?.length === undefined || v.length === options.length;
      ok &&= options?.minLength === undefined || v.length >= options.minLength;
      ok &&= options?.maxLength === undefined || v.length <= options.maxLength;
      ok &&= v.every((v) => schema.isType(v));
      return ok;
    }

    map(v: GetTypeFromSchema<S>[]): GetTypeFromMappedSchema<S>[] {
      return v.map((v) => schema.map(v)) as GetTypeFromMappedSchema<S>[];
    }
  })();
}
