import { $number, $object, Schema } from '../index';

/**
 * Represents a serializable JSON value.
 */
export type JsonValue =
  | null
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | { readonly [K in string]: JsonValue };

/**
 * Gets whether `v` is a serializable JSON value.
 */
export function isJsonValue(v: unknown): v is JsonValue {
  return (
    v === null ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    (Array.isArray(v) && v.every(isJsonValue)) ||
    (typeof v === 'object' &&
      v !== null &&
      Object.entries(v).every(
        ([k, v]) => typeof k === 'string' && isJsonValue(v),
      ))
  );
}

/**
 * A codec for a type to enable it to be encoded into and decoded from JSON.
 *
 * @example Adding support for Date
 * const dateCodec: TypeCodec<Date, string> = {
 *   jsonSchema: $string().thenMap(v => new Date(v)),
 *   isType: (v: unknown): v is Date => v instanceof Date,
 *   toJson: (v: Date): string => v.toISOString(),
 * }
 * const codec = createCodec(dateCodec);
 * const foo = { a: 1, b: new Date(0) };
 * const encoded = codec.encode(foo);
 * expect(encoded)
 *   .toBe('{"a":1,"b":{"$type":0,"value":"1970-01-01T00:00:00.000Z"}}');
 * const decoded = codec.decode(encoded);
 * expect(decoded).toEqual(foo);
 */
export interface TypeCodec<T, U extends JsonValue> {
  /**
   * The schema for the JSON representation of `T`. Must map to `U` (i.e. with
   * `thenMap`).
   *
   * @example For `<T=Date, U=string>`
   * $string().thenMap(v => new Date(v))
   */
  jsonSchema: Schema<U, T>;

  /**
   * Checks whether `v` has a type of `T`. You may choose to validate `v` as
   * well (e.g. call `Number.isFinite(v)` to check the validity of a Date `v`).
   *
   * @example For `<T=Date, U=string>`
   * (v: unknown): v is Date => v instanceof Date
   *
   * @example With validation
   * (v: unknown): v is Date => v instanceof Date && Number.isFinite(v)
   */
  isType(v: unknown): v is T;

  /**
   * Converts `v` to the JSON representation of `T`.
   *
   * @example For `<T=Date, U=string>`
   * (v: Date): string => v.toISOString()
   */
  toJson(v: T): U;
}

/**
 * Encodes arbitrary values into a JSON string, and decodes arbitrary JSON
 * strings back into JavaScript values.
 */
export interface Codec {
  /**
   * Encodes `v` as a JSON string. Ignores the `toJSON` function on any objects,
   * unlike the standard {@link JSON.stringify} function. If a type cannot be
   * encoded because there is no codec defined for that type, then the resulting
   * encoded value is unknown (no error is thrown).
   */
  encode(v: unknown): string;

  /**
   * Decodes a JSON string `v` into a JavaScript value.
   */
  decode(v: string): unknown;
}

/**
 * Creates a JSON codec that can encode arbitrary values to JSON, and decode
 * arbitrary JSON into JavaScript values, all while keeping types intact.
 *
 * @param types Type codecs that add support for encoding and decoding types
 *   that JavaScript normally doesn't encode or decode via {@link
  *   JSON.stringify} or {@link JSON.parse}.
 */
export function createCodec(...types: TypeCodec<unknown, JsonValue>[]): Codec {
  const schemas = types.map((t, i) =>
    $object({
      $type: $number().eq(i),
      value: t.jsonSchema,
    }).thenMap((v) => v.value),
  );

  function replace(key: string, value: unknown): unknown {
    for (let i = 0; i < types.length; i++) {
      const t = types[i];
      if (t.isType(value)) {
        return {
          $type: i,
          value: t.toJson(value),
        };
      }
    }
    return value;
  }

  function revive(key: string, value: unknown): unknown {
    for (const s of schemas) {
      if (s.isType(value) && s.isValid(value)) {
        return s.map(value);
      }
    }
    return value;
  }

  function deepReplace(k: string, v: unknown): unknown {
    const o = replace(k, v);
    if (Array.isArray(o)) {
      return o.map((v, k) => deepReplace(String(k), v));
    }
    if (typeof o === 'object' && o !== null) {
      return Object.fromEntries(
        Object.entries(o).map(([k, v]) => [k, deepReplace(k, v)]),
      );
    }
    return o;
  }

  return {
    encode: (v: unknown): string => JSON.stringify(deepReplace('', v)),
    decode: (v: string): unknown => JSON.parse(v, revive),
  };
}
