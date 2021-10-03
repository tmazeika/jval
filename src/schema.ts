// TS2545: A mixin class must have a constructor with a single rest parameter
// of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

interface ValidatorAndMapper<T, U = T> {
  isValid(v: T): v is Valid<T>;

  map(v: Valid<T>): U;
}

interface Typechecker<T> {
  isType(v: unknown): v is T;
}

type GetSchemaCtorType<S> = S extends Constructor<ValidatorAndMapper<infer T, unknown>> ? T : never;
type GetTypecheckerCtorType<S> = S extends Constructor<Typechecker<infer T>> ? T : never;
type GetSchemaCtorMappedType<S> = S extends Constructor<ValidatorAndMapper<unknown, infer U>> ? U : never;

export function WithValidator<S extends Constructor<ValidatorAndMapper<T, U>>, T = GetSchemaCtorType<S>, U = GetSchemaCtorMappedType<S>>(Schema: S, validator: (v: U) => boolean): S {
  return class extends Schema {
    isValid = (v: T): v is Valid<T> =>
      super.isValid(v) && validator(super.map(v));
  };
}

interface TypecheckerAndValidatorAndMapper<T, U = T> {
  isType(v: unknown): v is T;

  isValid(v: T): v is Valid<T>;

  map(v: Valid<T>): U;
}

type GetSchemaAllCtorType<S> = S extends Constructor<TypecheckerAndValidatorAndMapper<infer T, unknown>> ? T : never;
type GetSchemaAllCtorMappedType<S> = S extends Constructor<TypecheckerAndValidatorAndMapper<unknown, infer U>> ? U : never;

export function WithAll<S extends Constructor<TypecheckerAndValidatorAndMapper<T, U>>, T = GetSchemaAllCtorType<S>, U = GetSchemaAllCtorMappedType<S>>(Schema: S, typechecker: (v: unknown) => v is T, validator: (v: U) => boolean): S {
  return class extends Schema {
    isType(v: unknown): v is T {
      return super.isType(v) && typechecker(v);
    }

    isValid = (v: T): v is Valid<T> =>
      super.isValid(v) && validator(super.map(v));
  };
}

const brand = Symbol();

export type Valid<T> = {
  [brand]: never;
} & T;

export abstract class Schema<T, U = T> {
  abstract isType(v: unknown): v is T;

  abstract isValid(v: T): v is Valid<T>;

  thenValidate(validator: (v: U) => boolean): Schema<T, U> {
    const { isType, isValid, map } = this;
    return new (class extends Schema<T, U> {
      isType = isType;
      map = map;

      isValid = (v: T): v is Valid<T> => isValid(v) && validator(map(v));
    });
  }

  abstract map(v: Valid<T>): U;

  thenMap<V>(mapper: (v: U) => V): Schema<T, V> {
    const { isType, isValid, map } = this;
    return new class extends Schema<T, V> {
      isType = isType;
      isValid = isValid;

      map = (v: T) => mapper(map(v as Valid<T>));
    };
  }
}
