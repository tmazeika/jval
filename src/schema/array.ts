import { GetSchemaMappedType, GetSchemaType, Schema } from './schema';

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export class ArraySchema<
  S extends Schema<T, U>,
  T,
  U,
  N extends number = number,
> extends Schema<Tuple<T, N>, Tuple<U, N>> {
  protected readonly schema: S;

  constructor(schema: S) {
    super();
    this.schema = schema;
  }

  override isType(vs: unknown): vs is Tuple<T, N> {
    return Array.isArray(vs) && vs.every((v) => this.schema.isType(v));
  }

  override isValid(vs: Tuple<T, N>): boolean {
    return vs.every((v) => this.schema.isValid(v));
  }

  override map(vs: Tuple<T, N>): Tuple<U, N> {
    return vs.map((v) => this.schema.map(v)) as Tuple<U, N>;
  }
}

export class AnyArraySchema<S extends Schema<T, U>, T, U> extends ArraySchema<
  S,
  T,
  U
> {
  /**
   * Validates that arrays have at least `n` elements.
   */
  minLength(n: number): AnyArraySchema<S, T, U> {
    return new (class extends AnyArraySchema<S, T, U> {
      override isValid(vs: T[]): boolean {
        return super.isValid(vs) && super.map(vs).length >= n;
      }
    })(this.schema);
  }

  /**
   * Validates that arrays to have at most `n` elements.
   */
  maxLength(n: number): AnyArraySchema<S, T, U> {
    return new (class extends AnyArraySchema<S, T, U> {
      override isValid(vs: T[]): boolean {
        return super.isValid(vs) && super.map(vs).length <= n;
      }
    })(this.schema);
  }
}

export class ExactArraySchema<
  S extends Schema<T, U>,
  T,
  U,
> extends AnyArraySchema<S, T, U> {
  /**
   * Validates that arrays have exactly `n` elements.
   */
  length<N extends number>(n: N): Schema<Tuple<T, N>, Tuple<U, N>> {
    return new (class extends ArraySchema<S, T, U, N> {
      override isType(vs: unknown): vs is Tuple<T, N> {
        return super.isType(vs) && vs.length === n;
      }

      override isValid(vs: Tuple<T, N>): boolean {
        return super.isValid(vs) && vs.length === n;
      }
    })(this.schema);
  }
}

/**
 * Creates an array schema.
 * @param schema The schema of each element.
 *
 * @example
 * $array($string()).isType([]);         // true
 * $array($string()).isType(['a', 'b']); // true
 * $array($string()).isType(['a', 123]); // false
 * $array($string()).isType('hello');    // false
 */
export function $array<
  S extends Schema<T, U>,
  T = GetSchemaType<S>,
  U = GetSchemaMappedType<S>,
>(schema: S): ExactArraySchema<S, T, U> {
  return new ExactArraySchema<S, T, U>(schema);
}
