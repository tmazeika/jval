interface ValidatorAndMapper<T, U = T> {
  isValid(v: T): boolean;

  map(v: T): U;
}

export abstract class Schema<T, U = T> implements ValidatorAndMapper<T, U> {
  abstract isType(v: unknown): v is T;

  abstract isValid(v: T): boolean;

  thenValidate(validator: (v: U) => boolean): Schema<T, U> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T, U> {
      override isType = isType;
      override map = map;

      override isValid(v: T): boolean {
        return isValid(v) && validator(map(v));
      }
    })();
  }

  abstract map(v: T): U;

  thenMap<V>(mapper: (v: U) => V): Schema<T, V> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T, V> {
      override isType = isType;
      override isValid = isValid;

      override map(v: T): V {
        return mapper(map(v));
      }
    })();
  }

  or<S extends Schema<V, W>, V = GetSchemaType<S>, W = GetSchemaMappedType<S>>(
    schema: S,
  ): Schema<T | V, U | W> {
    const isType = this.isType.bind(this);
    const isValid = this.isValid.bind(this);
    const map = this.map.bind(this);
    return new (class extends Schema<T | V, U | W> {
      override isType(v: unknown): v is T | V {
        return isType(v) || schema.isType(v);
      }

      override isValid(v: T | V): boolean {
        return isType(v) ? isValid(v) : schema.isValid(v);
      }

      override map(v: T | V): U | W {
        return isType(v) ? map(v) : schema.map(v);
      }
    })();
  }
}

export class BaseSchema<T> extends Schema<T> {
  override isType(v: unknown): v is T {
    return true;
  }

  // This method is meant to be overridden, otherwise no real validation occurs.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override isValid(v: T): boolean {
    return true;
  }

  override map(v: T): T {
    return v;
  }
}

export type GetSchemaType<S> = S extends Schema<infer T, unknown> ? T : never;
export type GetSchemaMappedType<S> = S extends Schema<unknown, infer U>
  ? U
  : never;

// TS2545: A mixin class must have a constructor with a single rest parameter
// of type 'any[]'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

type GetSchemaCtorType<S> = S extends Constructor<
  ValidatorAndMapper<infer T, unknown>
>
  ? T
  : never;
type GetSchemaCtorMappedType<S> = S extends Constructor<
  ValidatorAndMapper<unknown, infer U>
>
  ? U
  : never;

export const WithValidator = <
  S extends Constructor<ValidatorAndMapper<T, U>>,
  T = GetSchemaCtorType<S>,
  U = GetSchemaCtorMappedType<S>,
>(
  Schema: S,
  validator: (v: U) => boolean,
): S =>
  class extends Schema {
    override isValid(v: T): boolean {
      return super.isValid(v) && validator(super.map(v));
    }
  };
