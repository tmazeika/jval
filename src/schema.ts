// TS2545: A mixin class must have a constructor with a single rest parameter
// of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

type ValidateArg<S> = S extends Constructor<{ isValid(v: infer T): boolean }> ? T : never;

export function WithValidator<S extends Constructor<{ isValid(v: unknown): boolean }>>(Schema: S, fn: (v: ValidateArg<S>) => boolean): S {
  return class extends Schema {
    isValid = (v: ValidateArg<S>) => super.isValid(v) && fn(v);
  };
}

export interface None {
  readonly _tag: 'None'
}

/**
 * @category model
 * @since 2.0.0
 */
export interface Some<A> {
  readonly _tag: 'Some'
  readonly value: A
}



/**
 * @category model
 * @since 2.0.0
 */
export type Option<A> = None | Some<A>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * `None` doesn't have a constructor, instead you can use it directly as a value. Represents a missing value.
 *
 * @category constructors
 * @since 2.0.0
 */
export const none: Option<never> = _.none

/**
 * Constructs a `Some`. Represents an optional value that exists.
 *
 * @category constructors
 * @since 2.0.0
 */
export const some: <A>(a: A) => Option<A> = _.some

export abstract class Schema<T, U = T> {
  abstract isType(v: unknown): v is T;

  abstract isValid(v: T): boolean;

  thenValidate(validator: (v: U) => boolean): Schema<T, U> {
    const { isType, isValid, map } = this;
    return new (class extends Schema<T, U> {
      isType = isType;
      map = map;

      isValid = (v: T): v is T & Validated<T> => isValid(v) && validator(map(v));
    });
  }

  abstract map(v: Validated<T>): U;

  thenMap<V>(mapper: (v: U) => V): Schema<T, V> {
    const { isType, isValid, map } = this;
    return new class extends Schema<T, V> {
      isType = isType;
      isValid = isValid;

      map = (v: T) => mapper(map(v as Validated<T>));
    };
  }
}
