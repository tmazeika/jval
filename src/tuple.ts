import { GetSchemaMappedType, GetSchemaType, Schema } from './schema';

type GetTupleSchemaType<S> = {
  [I in keyof S]: GetSchemaType<S[I]>;
};

type GetTupleSchemaMappedType<S> = {
  [I in keyof S]: GetSchemaMappedType<S[I]>;
};

/**
 * Creates an array schema of a fixed length, where each element has its own
 * schema.
 * @param schemas The schemas of corresponding elements in order.
 *
 * @example
 * $tuple($string()).isType(['a']);      // true
 * $tuple($string()).isType(['a', 'b']); // false
 *
 * $tuple($string(), $number()).isType(['a', 1]);    // true
 * $tuple($string(), $number()).isType(['a']);       // false
 * $tuple($string(), $number()).isType(['a', 1, 2]); // false
 */
export function $tuple<S extends Schema<unknown>[]>(
  ...schemas: S
): Schema<GetTupleSchemaType<S>, GetTupleSchemaMappedType<S>> {
  type T = GetTupleSchemaType<S>;
  type U = GetTupleSchemaMappedType<S>;
  return new (class extends Schema<T, U> {
    override isType(vs: unknown): vs is T {
      return (
        Array.isArray(vs) &&
        vs.length === schemas.length &&
        vs.every((v, i) => schemas[i].isType(v))
      );
    }

    override isValid(vs: T): boolean {
      return vs.every((v, i) => schemas[i].isValid(v));
    }

    override map(vs: T): U {
      return vs.map((v, i) => schemas[i].map(v)) as U;
    }
  })();
}
