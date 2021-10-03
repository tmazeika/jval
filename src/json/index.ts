import { number, object, Schema } from '../index';

/**
 * Represents a JSON serializable value.
 */
export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [K in string]: JsonValue };

/**
 * Gets whether `v` is a JsonValue.
 *
 * @param v
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
 * A codec for a type in order to enable it to be encoded into and decoded from
 * JSON.
 *
 * @example Adding support for Date
 * // we use <Date, string> to mean that our canonical type for our model is the
 * // built-in Date type, while it will be represented in JSON as a string (ISO
 * // 8601 format)
 * const dateCodec: TypeCodec<Date, string> = {
 *   // this schema is responsible for describing of what type our Date object
 *   // will be represented in JSON form, _as well as_ converting from that
 *   // string representation back to an actual Date using a mapper
 *   jsonSchema: string().withMapper(v => new Date(v)),
 *
 *   // this function is used inside the codec to determine whether a value that
 *   // it's trying to encode should be handled by this codec; in this case,
 *   // values that are instances of a Date should be handled by this codec
 *   isType: (v: unknown): v is Date => v instanceof Date,
 *
 *   // this function encodes a Date into a string described by `jsonSchema`
 *   // above
 *   toJson: (v: Date): string => v.toISOString(),
 * }
 *
 * const codec = createCodec(dateCodec);
 * const json = codec.encode({ a: 1, b: new Date(0) });
 * // json = '{"a":1,"b":{"$type":0,"value":"1970-01-01T00:00:00.000Z"}}'
 * codec.decode(json); // equal to { a: 1, b: new Date(0) }
 */
export interface TypeCodec<T, U extends JsonValue> {
  /**
   * The schema for the JSON representation of `T`.
   */
  jsonSchema: Schema<U, T>;

  /**
   * Checks whether `v` has a type of `T`.
   *
   * @param v
   */
  isType(v: unknown): v is T;

  /**
   * Converts `v` to the JSON representation of `T`.
   *
   * @param v
   */
  toJson(v: T): U;
}

/**
 * Encodes arbitrary values into a JSON string, and arbitrary JSON strings back
 * into JavaScript values.
 */
export interface Codec {
  /**
   * Encodes `v` as a JSON string. Ignores the `toJSON` function on any objects,
   * unlike the standard {@link JSON.stringify} function. If a type cannot be
   * encoded because there is no codec defined for that type, then the resulting
   * encoded value is unknown (no error is thrown).
   *
   * @param v
   */
  encode(v: unknown): string;

  /**
   * Decodes a JSON string `v` into a JavaScript value.
   *
   * @param v
   */
  decode(v: string): unknown;
}

/**
 * Creates a JSON codec that can encode arbitrary values to JSON, and decode
 * JSON into arbitrary values, all while keeping types intact.
 *
 * @param types Type codecs that add support for encoding and decoding types
 *   that JavaScript normally doesn't encode or decode via {@link
 *   JSON.stringify} or {@link JSON.parse}, respectively.
 */
export function createCodec(...types: TypeCodec<unknown, JsonValue>[]): Codec {
  const schemas = types.map((t, i) =>
    object({
      $type: number({ eq: i }),
      value: t.jsonSchema,
    }).withMapper((v) => v.value),
  );

  function replace(key: string, value: unknown): unknown {
    for (const [i, t] of Array.from(types.entries())) {
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
      if (s.isType(value)) {
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
