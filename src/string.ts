import { Schema } from '.';

interface Options {
  /**
   * When `true`, requires that the string have a length greater than 0. By
   * default, the string can be empty.
   */
  nonempty?: boolean;

  /**
   * The minimum length of the string, inclusive. By default, this is
   * effectively 0.
   */
  minLength?: number;

  /**
   * The maximum length of the string, inclusive. By default, there is no
   * maximum length.
   */
  maxLength?: number;

  /**
   * When set, the string must match exactly one of the strings in this array.
   */
  oneOf?: readonly string[];

  /**
   * When set, the string must match this regular expression.
   */
  regExp?: RegExp;
}

type NarrowedString<O extends Options> = O['oneOf'] extends readonly (infer T)[]
  ? T
  : string;

/**
 * Creates a value schema for a string.
 *
 * @param options
 */
export function string<O extends Options>(
  options?: O,
): Schema<NarrowedString<O>>;

/**
 * Creates a value schema for a string.
 *
 * @param options
 */
export function string(options?: Options): Schema<string>;

/**
 * Creates a value schema for a string.
 *
 * @param options
 */
export function string(options?: Options): Schema<string> {
  return new (class extends Schema<string> {
    isType(v: unknown): v is string {
      if (typeof v !== 'string') {
        return false;
      }
      let ok = !options?.nonempty || v.length > 0;
      ok &&= options?.minLength === undefined || v.length >= options.minLength;
      ok &&= options?.maxLength === undefined || v.length <= options.maxLength;
      ok &&= options?.oneOf === undefined || options.oneOf.includes(v);
      ok &&= options?.regExp === undefined || options.regExp.test(v);
      return ok;
    }

    map(v: string): string {
      return v;
    }
  })();
}
